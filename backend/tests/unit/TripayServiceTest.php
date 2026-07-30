<?php

use App\Libraries\TripayService;
use CodeIgniter\Test\CIUnitTestCase;

/** @internal */
final class TripayServiceTest extends CIUnitTestCase
{
    public function testRejectsCallbackWhenPrivateKeyIsMissing(): void
    {
        $service = new TripayService(['private_key' => '']);
        $this->assertFalse($service->verifyCallbackSignature('{}', 'anything'));
    }

    public function testUsesTimingSafeValidSignatureCheck(): void
    {
        $payload = '{"merchant_ref":"INV-1","status":"PAID"}';
        $key = 'test-private-key';
        $service = new TripayService(['private_key' => $key]);

        $this->assertTrue($service->verifyCallbackSignature($payload, hash_hmac('sha256', $payload, $key)));
        $this->assertFalse($service->verifyCallbackSignature($payload, str_repeat('0', 64)));
    }
}
