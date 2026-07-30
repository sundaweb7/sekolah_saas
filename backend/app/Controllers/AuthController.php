<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\SchoolModel;
use App\Models\RefreshTokenModel;
use App\Models\PasswordResetModel;
use App\Libraries\JWTService;
use CodeIgniter\HTTP\ResponseInterface;

class AuthController extends BaseResourceController
{
    protected JWTService $jwtService;

    public function __construct()
    {
        $this->jwtService = new JWTService();
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(): ResponseInterface
    {
        $body = $this->getRequestBody();
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;
        $rememberMe = (bool) ($body['remember_me'] ?? false);

        if (empty($email) || empty($password)) {
            return $this->respondError('Email and Password are required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $userModel = new UserModel();

        // If CURRENT_SCHOOL_ID is defined (resolved via TenantFilter), scope search to that school.
        // Otherwise, lookup globally (e.g. superadmin login) where school_id is NULL.
        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        $user = $userModel->where('email', $email)
                          ->where('school_id', $schoolId)
                          ->where('status', 'active')
                          ->first();

        if (!$user || !password_verify($password, $user->password_hash)) {
            return $this->respondError('Invalid email or password', ResponseInterface::HTTP_UNAUTHORIZED);
        }
        if (($user->role === 'superadmin' && $user->school_id !== null)
            || ($user->role !== 'superadmin' && $user->school_id === null)) {
            log_message('critical', 'Rejected invalid role/tenant binding for user ID {id}', ['id' => $user->id]);
            return $this->respondError('Account configuration is invalid', ResponseInterface::HTTP_FORBIDDEN);
        }

        $schoolLevel = 'TK';
        $allowedFeatures = [];
        if ($user->school_id) {
            $schoolModel = new SchoolModel();
            $school = $schoolModel->find($user->school_id);
            if ($school) {
                $schoolLevel = $school->level;

                // Resolve active plan type
                $planType = 'trial';
                $subscriptionModel = new \App\Models\SubscriptionModel();
                $subscription = $subscriptionModel->where('school_id', $user->school_id)
                                                   ->where('status', 'active')
                                                   ->first();
                if ($subscription) {
                    if (strpos(strtolower($subscription->plan_name), 'basic') !== false) {
                        $planType = 'basic';
                    } elseif (strpos(strtolower($subscription->plan_name), 'standard') !== false) {
                        $planType = 'standard';
                    } elseif (strpos(strtolower($subscription->plan_name), 'premium') !== false) {
                        $planType = 'premium';
                    }
                }
                
                // Get allowed features
                $featureModel = new \App\Models\FeatureSettingModel();
                $allFeatures = $featureModel->findAll();
                $levelColumn = 'level_' . strtolower($schoolLevel);
                $planColumn = 'plan_' . $planType;
                foreach ($allFeatures as $f) {
                    $levelActive = isset($f[$levelColumn]) && (int)$f[$levelColumn] === 1;
                    $planActive = isset($f[$planColumn]) && (int)$f[$planColumn] === 1;
                    if ($levelActive && $planActive) {
                        $allowedFeatures[] = $f['feature_key'];
                    }
                }
            }
        }

        // Generate Access Token (JWT)
        $payload = [
            'id'               => $user->id,
            'school_id'        => $user->school_id,
            'school_level'     => $schoolLevel,
            'allowed_features' => (new \App\Services\FeatureAccessService())->forSchool($user->school_id ? (int) $user->school_id : null),
            'email'            => $user->email,
            'role'             => $user->role,
            'full_name'        => $user->full_name
        ];
        $accessToken = $this->jwtService->generateToken($payload);

        // Generate Refresh Token
        $refreshTokenString = bin2hex(random_bytes(32));
        $refreshExpire = env('JWT_REFRESH_EXPIRE', 2592000); // 30 days
        $expiresAt = date('Y-m-d H:i:s', time() + $refreshExpire);

        $refreshTokenModel = new RefreshTokenModel();
        // Revoke existing tokens for the user in this school first
        $refreshTokenModel->where('user_id', $user->id)->delete();

        $refreshTokenModel->save([
            'school_id'  => $user->school_id,
            'user_id'    => $user->id,
            'token'      => hash('sha256', $refreshTokenString),
            'expires_at' => $expiresAt
        ]);

        return $this->respondSuccess([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshTokenString,
            'user' => [
                'id'               => $user->id,
                'email'            => $user->email,
                'role'             => $user->role,
                'full_name'        => $user->full_name,
                'school_id'        => $user->school_id,
                'school_level'     => $schoolLevel,
                'allowed_features' => (new \App\Services\FeatureAccessService())->forSchool($user->school_id ? (int) $user->school_id : null)
            ]
        ], 'Login successful');
    }

    /**
     * POST /api/v1/auth/refresh
     */
    public function refresh(): ResponseInterface
    {
        $refreshTokenString = $this->request->getVar('refresh_token');

        if (empty($refreshTokenString)) {
            return $this->respondError('Refresh token is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $refreshTokenModel = new RefreshTokenModel();
        $tokenRecord = $refreshTokenModel->where('token', hash('sha256', $refreshTokenString))->first();

        if (!$tokenRecord || strtotime($tokenRecord->expires_at) < time()) {
            return $this->respondError('Invalid or expired refresh token', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $userModel = new UserModel();
        $user = $userModel->find($tokenRecord->user_id);

        if (!$user || $user->status !== 'active'
            || (int) ($user->school_id ?? 0) !== (int) ($tokenRecord->school_id ?? 0)
            || ($user->role === 'superadmin' && $user->school_id !== null)
            || ($user->role !== 'superadmin' && $user->school_id === null)) {
            return $this->respondError('User not active', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        // Block token refresh if the original token was an impersonation session
        $authHeader = $this->request->getServer('HTTP_AUTHORIZATION') ?? $this->request->getHeaderLine('Authorization');
        if (!empty($authHeader)) {
            $arr = explode(" ", $authHeader);
            $accessTokenString = count($arr) > 1 ? $arr[1] : null;
            if ($accessTokenString) {
                $decoded = $this->jwtService->decodeToken($accessTokenString);
                if ($decoded && !empty($decoded->is_impersonating)) {
                    return $this->respondError('Session refresh is not allowed for impersonation sessions', ResponseInterface::HTTP_UNAUTHORIZED);
                }
            }
        }

        // Generate new Access Token
        $payload = [
            'id'        => $user->id,
            'school_id' => $user->school_id,
            'email'     => $user->email,
            'role'      => $user->role,
            'full_name' => $user->full_name
        ];
        $payload['allowed_features'] = (new \App\Services\FeatureAccessService())->forSchool($user->school_id ? (int) $user->school_id : null);
        $newAccessToken = $this->jwtService->generateToken($payload);

        $newRefreshToken = bin2hex(random_bytes(32));
        $refreshExpire = (int) env('JWT_REFRESH_EXPIRE', 2592000);
        $refreshTokenModel->update($tokenRecord->id, [
            'token' => hash('sha256', $newRefreshToken),
            'expires_at' => date('Y-m-d H:i:s', time() + $refreshExpire),
        ]);

        return $this->respondSuccess([
            'access_token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
        ], 'Token refreshed successfully');
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(): ResponseInterface
    {
        $refreshTokenString = $this->request->getVar('refresh_token');

        if (!empty($refreshTokenString)) {
            $refreshTokenModel = new RefreshTokenModel();
            $refreshTokenModel->where('token', hash('sha256', $refreshTokenString))->delete();
        }

        return $this->respondSuccess(null, 'Logged out successfully');
    }

    /** Exchange a short-lived, single-use impersonation code on the target tenant. */
    public function exchangeImpersonation(): ResponseInterface
    {
        $code = (string) ($this->getRequestBody()['code'] ?? '');
        if (strlen($code) !== 64 || !ctype_xdigit($code) || !defined('CURRENT_SCHOOL_ID')) {
            return $this->respondError('Invalid or expired impersonation code', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $model = new \App\Models\ImpersonationTokenModel();
        $record = $model->where('token_hash', hash('sha256', $code))->first();
        if (!$record || (int) $record->school_id !== (int) CURRENT_SCHOOL_ID || strtotime($record->expires_at) < time()) {
            return $this->respondError('Invalid or expired impersonation code', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $db = \Config\Database::connect();
        $db->transStart();
        $model->where('id', $record->id)->where('token_hash', hash('sha256', $code))->delete();
        if ($db->affectedRows() !== 1) {
            $db->transRollback();
            return $this->respondError('Invalid or expired impersonation code', ResponseInterface::HTTP_UNAUTHORIZED);
        }
        $user = (new UserModel())->find($record->user_id);
        if (!$user || $user->status !== 'active' || (int) $user->school_id !== (int) CURRENT_SCHOOL_ID || $user->role === 'superadmin') {
            $db->transRollback();
            return $this->respondError('Impersonation target is unavailable', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $features = (new \App\Services\FeatureAccessService())->forSchool((int) $user->school_id);
        $accessToken = $this->jwtService->generateToken([
            'id' => $user->id, 'school_id' => $user->school_id, 'email' => $user->email,
            'role' => $user->role, 'full_name' => $user->full_name, 'allowed_features' => $features,
            'is_impersonating' => true,
        ], 300); // 5 minutes expiration
        $refreshToken = bin2hex(random_bytes(32));
        (new RefreshTokenModel())->insert([
            'school_id' => $user->school_id, 'user_id' => $user->id,
            'token' => hash('sha256', $refreshToken), 'expires_at' => date('Y-m-d H:i:s', time() + 300), // expire refresh token in 5 mins too
        ]);
        $db->transComplete();
        if (!$db->transStatus()) {
            return $this->respondError('Unable to create impersonation session', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess([
            'access_token' => $accessToken, 'refresh_token' => $refreshToken,
            'user' => ['id' => $user->id, 'email' => $user->email, 'role' => $user->role,
                'full_name' => $user->full_name, 'school_id' => $user->school_id, 'allowed_features' => $features],
        ], 'Impersonation session created');
    }

    /**
     * POST /api/v1/auth/register-tenant
     */
    public function registerTenant(): ResponseInterface
    {
        $body = $this->getRequestBody();
        $schoolName = $body['school_name'] ?? null;
        $subdomain = $body['subdomain'] ?? null;
        $adminName = $body['admin_name'] ?? null;
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;
        $phone = $body['phone'] ?? null;
        $npsn = $body['npsn'] ?? null;
        $level = $body['level'] ?? 'TK';

        if (empty($schoolName) || empty($subdomain) || empty($adminName) || empty($email) || empty($password) || empty($phone) || empty($npsn)) {
            return $this->respondError('All fields are required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $subdomain = strtolower(trim($subdomain));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)
            || strlen($password) < 8
            || !preg_match('/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/', $subdomain)) {
            return $this->respondError('Email, password, atau subdomain tidak valid', ResponseInterface::HTTP_BAD_REQUEST);
        }

        if (!in_array($level, ['TK', 'SD', 'SMP', 'SMA', 'MTS_MA', 'SMK', 'PESANTREN'])) {
            $level = 'TK';
        }

        $schoolModel = new SchoolModel();
        // Check if subdomain is already taken
        if ($schoolModel->where('subdomain', $subdomain)->first()) {
            return $this->respondError('Subdomain is already taken', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $db = \Config\Database::connect();
        $db->transStart();

        // 1. Create School
        $schoolId = $schoolModel->insert([
            'name'      => $schoolName,
            'subdomain' => $subdomain,
            'status'    => 'active',
            'phone'     => $phone,
            'npsn'      => $npsn,
            'level'     => $level
        ]);

        // 2. Create User Admin
        $userModel = new UserModel();
        // Temporarily bypass tenant scoping check since CURRENT_SCHOOL_ID is not defined during registration
        // (Wait, setSchoolId hook uses CURRENT_SCHOOL_ID, which is null, so we must explicitly pass school_id in fields)
        $userModel->insert([
            'school_id'     => $schoolId,
            'email'         => $email,
            'password_hash' => $password, // hashed automatically by model hook
            'role'          => 'admin',
            'full_name'     => $adminName,
            'status'        => 'active'
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return $this->respondError('Failed to register tenant', ResponseInterface::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->respondSuccess([
            'school_id' => $schoolId,
            'subdomain' => $subdomain
        ], 'Tenant registered successfully', ResponseInterface::HTTP_CREATED);
    }

    /**
     * POST /api/v1/auth/forgot-password
     */
    public function forgotPassword(): ResponseInterface
    {
        $email = $this->request->getVar('email');

        if (empty($email)) {
            return $this->respondError('Email is required', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        $userModel = new UserModel();
        $user = $userModel->where('email', $email)
                          ->where('school_id', $schoolId)
                          ->first();

        if (!$user) {
            // For security, don't expose if user exists or not, but for developer testing we can proceed
            return $this->respondSuccess(null, 'If the email exists, a reset link will be sent.');
        }

        $token = bin2hex(random_bytes(16));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $passwordResetModel = new PasswordResetModel();
        $passwordResetModel->where('email', $email)
                           ->where('school_id', $schoolId)
                           ->delete();

        $passwordResetModel->save([
            'school_id'  => $schoolId,
            'email'      => $email,
            'token'      => hash('sha256', $token),
            'expires_at' => $expiresAt
        ]);

        if (ENVIRONMENT === 'production') {
            $frontendUrl = rtrim((string) env('FRONTEND_BASE_URL', base_url()), '/');
            $resetUrl = $frontendUrl . '/reset-password?token=' . rawurlencode($token);
            $emailService = \Config\Services::email();
            $emailService->setTo($user->email);
            $emailService->setSubject('Reset Password PAUDKU / Koola');
            $emailService->setMessage(
                '<p>Gunakan tautan berikut untuk mengatur ulang password. Tautan berlaku selama satu jam.</p>'
                . '<p><a href="' . esc($resetUrl) . '">Reset password</a></p>'
            );
            if (!$emailService->send()) {
                log_message('error', 'Password reset email could not be sent for user ID {id}', ['id' => $user->id]);
            }
        }

        // In a real application, email/sms is sent. For local API testing, we return the token in JSON.
        $responseData = ENVIRONMENT === 'production' ? null : ['reset_token' => $token];
        return $this->respondSuccess($responseData, 'If the email exists, a reset link will be sent.');
    }

    /**
     * POST /api/v1/auth/reset-password
     */
    public function resetPassword(): ResponseInterface
    {
        $token = $this->request->getVar('token');
        $password = $this->request->getVar('password');

        if (empty($token) || empty($password)) {
            return $this->respondError('Token and Password are required', ResponseInterface::HTTP_BAD_REQUEST);
        }
        if (strlen($password) < 8) {
            return $this->respondError('Password must contain at least 8 characters', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $schoolId = defined('CURRENT_SCHOOL_ID') ? CURRENT_SCHOOL_ID : null;

        $passwordResetModel = new PasswordResetModel();
        $resetRecord = $passwordResetModel->where('token', hash('sha256', $token))
                                           ->where('school_id', $schoolId)
                                           ->first();

        if (!$resetRecord || strtotime($resetRecord->expires_at) < time()) {
            return $this->respondError('Invalid or expired reset token', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $userModel = new UserModel();
        $user = $userModel->where('email', $resetRecord->email)
                          ->where('school_id', $schoolId)
                          ->first();

        if (!$user) {
            return $this->respondError('User not found', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Update password (hashed by model hook)
        $userModel->update($user->id, [
            'password_hash' => $password
        ]);

        // Clean up reset token
        $passwordResetModel->delete($resetRecord->id);

        return $this->respondSuccess(null, 'Password has been reset successfully');
    }

    /**
     * GET /api/v1/auth/profile
     * Memerlukan autentikasi filter jwt_role
     */
    public function profile(): ResponseInterface
    {
        // User retrieved from request (set by JWTRoleAuthFilter)
        $userPayload = $this->request->user ?? null;

        if (!$userPayload) {
            return $this->respondError('Unauthorized access', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $userModel = new UserModel();
        $user = $userModel->find($userPayload->id);

        if (!$user) {
            return $this->respondError('User not found', ResponseInterface::HTTP_NOT_FOUND);
        }

        $schoolLevel = 'TK';
        $allowedFeatures = [];
        if ($user->school_id) {
            $schoolModel = new SchoolModel();
            $school = $schoolModel->find($user->school_id);
            if ($school) {
                $schoolLevel = $school->level;

                // Resolve active plan type
                $planType = 'trial';
                $subscriptionModel = new \App\Models\SubscriptionModel();
                $subscription = $subscriptionModel->where('school_id', $user->school_id)
                                                   ->where('status', 'active')
                                                   ->first();
                if ($subscription) {
                    if (strpos(strtolower($subscription->plan_name), 'basic') !== false) {
                        $planType = 'basic';
                    } elseif (strpos(strtolower($subscription->plan_name), 'standard') !== false) {
                        $planType = 'standard';
                    } elseif (strpos(strtolower($subscription->plan_name), 'premium') !== false) {
                        $planType = 'premium';
                    }
                }
                
                // Get allowed features
                $featureModel = new \App\Models\FeatureSettingModel();
                $allFeatures = $featureModel->findAll();
                $levelColumn = 'level_' . strtolower($schoolLevel);
                $planColumn = 'plan_' . $planType;
                foreach ($allFeatures as $f) {
                    $levelActive = isset($f[$levelColumn]) && (int)$f[$levelColumn] === 1;
                    $planActive = isset($f[$planColumn]) && (int)$f[$planColumn] === 1;
                    if ($levelActive && $planActive) {
                        $allowedFeatures[] = $f['feature_key'];
                    }
                }
            }
        }

        return $this->respondSuccess([
            'id'               => $user->id,
            'school_id'        => $user->school_id,
            'school_level'     => $schoolLevel,
            'allowed_features' => (new \App\Services\FeatureAccessService())->forSchool($user->school_id ? (int) $user->school_id : null),
            'email'            => $user->email,
            'role'             => $user->role,
            'full_name'        => $user->full_name,
            'status'           => $user->status
        ], 'Profile retrieved successfully');
    }

    /**
     * POST /api/v1/auth/change-password
     * Memerlukan autentikasi filter jwt_role
     */
    public function changePassword(): ResponseInterface
    {
        $userPayload = $this->request->user ?? null;
        $oldPassword = $this->request->getVar('old_password');
        $newPassword = $this->request->getVar('new_password');

        if (!$userPayload) {
            return $this->respondError('Unauthorized access', ResponseInterface::HTTP_UNAUTHORIZED);
        }

        if (empty($oldPassword) || empty($newPassword)) {
            return $this->respondError('Old password and new password are required', ResponseInterface::HTTP_BAD_REQUEST);
        }
        if (strlen($newPassword) < 8) {
            return $this->respondError('New password must contain at least 8 characters', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $userModel = new UserModel();
        $user = $userModel->find($userPayload->id);

        if (!$user || !password_verify($oldPassword, $user->password_hash)) {
            return $this->respondError('Incorrect old password', ResponseInterface::HTTP_BAD_REQUEST);
        }

        // Update password (hashed by model hook)
        $userModel->update($user->id, [
            'password_hash' => $newPassword
        ]);

        return $this->respondSuccess(null, 'Password changed successfully');
    }
}
