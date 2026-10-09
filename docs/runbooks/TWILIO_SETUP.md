# Twilio setup for safety notifications

This file is a setup checklist only. The current production system remains fail-closed until the Twilio adapter and callback verification are implemented and tested.

## Where to enter values

Enter real values only on the VPS, as root, in:

```text
/etc/agentkid.env
```

File permissions must remain `root:root` and `0600`. Do not put real credentials in Git, `.env.twilio.example`, terminal commands, screenshots, or chat.

Use `.env.twilio.example` as the key template.

## Values to obtain from Twilio

- `TWILIO_ACCOUNT_SID`: Account SID (`AC...`).
- `TWILIO_API_KEY`: preferably a production API key (`SK...`).
- `TWILIO_API_SECRET`: secret for that API key.
- `TWILIO_FROM_NUMBER`: a Voice-capable Twilio number in E.164 format, for example `+1...`.
- `TWILIO_MESSAGING_SERVICE_SID`: approved Messaging Service SID (`MG...`) for SMS.
- `TWILIO_STATUS_CALLBACK_URL`: public HTTPS callback URL.
- `TWILIO_ENABLED`: keep `false` until the provider adapter, consent, callback signature validation, and supervised test are complete.

## Required Twilio console steps

1. Rotate any Auth Token that has ever been pasted into chat, logs, or a terminal transcript.
2. Upgrade the account if production calls/SMS are required; trial accounts restrict recipients and geography.
3. Enable Vietnam in Voice/Messaging Geographic Permissions.
4. Provision a Voice-capable number and configure its caller ID.
5. Create a Messaging Service.
6. For Vietnam SMS, register the `AGENTKID`/`SNOW` Alphanumeric Sender ID and message templates. Twilio requires carrier registration and supporting business documents.
7. Configure an HTTPS status callback only after the application endpoint exists.

## Recipient format

The test recipient `0941836793` must be represented as:

```text
+84941836793
```

Do not place the recipient's number in this template or in Git. Store verified emergency contacts in the production database only after consent is recorded.

## Before enabling real delivery

- Verify explicit consent for each emergency contact.
- Confirm the emergency message does not expose unnecessary child data.
- Validate Twilio webhook signatures.
- Add idempotency, bounded retry, audit status, and provider timeout handling.
- Test with provider mocks first, then one supervised real call.
- Do not represent an alert as delivered unless Twilio confirms the callback status.
- This system must not claim to replace local emergency services.
