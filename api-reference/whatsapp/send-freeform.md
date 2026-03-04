
---
title: "Freiform-WhatsApp-Nachricht senden"
api: "POST https://app.famulor.de/api/user/whatsapp/send-freeform"
icon: "whatsapp"
description: "Freitext-WhatsApp-Nachrichten innerhalb eines aktiven 24-Stunden-Fensters über Famulor senden"
---

# Freiform-WhatsApp-Nachricht senden

> Eine Freitext-WhatsApp-Nachricht innerhalb eines aktiven 24-Stunden-Fensters senden

Dieser Endpunkt sendet eine Freiform- (Freitext-) WhatsApp-Nachricht an einen Empfänger. Im Gegensatz zu Template-Nachrichten kann der Inhalt beliebigen Text enthalten, er **erfordert jedoch ein aktives 24-Stunden-Messaging-Fenster** – der Empfänger muss innerhalb der letzten 24 Stunden eine Nachricht an Ihren WhatsApp-Sender geschickt haben.

<Warning>
  Freiform-Nachrichten können nur während eines aktiven 24-Stunden-Fensters gesendet werden. Wenn die Session abgelaufen ist, müssen Sie zunächst eine [Template-Nachricht](/api-reference/whatsapp/send-template) senden, um die Konversation wieder zu starten. Verwenden Sie den Endpunkt [Session-Status](/api-reference/whatsapp/session-status), um zu prüfen, ob eine Session aktiv ist.
</Warning>

<Note>
  Dieser Endpunkt ist auf **5 Requests pro Sekunde** pro Benutzer rate-limitiert.
</Note>

### Anfrage-Body

<ParamField body="sender_id" type="integer" required>
  Die ID des WhatsApp-Senders, von dem gesendet werden soll (erhalten über [WhatsApp-Sender abrufen](/api-reference/whatsapp/get-senders))
</ParamField>

<ParamField body="recipient_phone" type="string" required>
  Die Telefonnummer des Empfängers im internationalen Format (z.B. `+1234567890`)
</ParamField>

<ParamField body="message" type="string" required>
  Der zu sendende Nachrichteninhalt (max. 4096 Zeichen)
</ParamField>

### Antwort-Felder

<ResponseField name="success" type="boolean">
  Ob die Nachricht erfolgreich gesendet wurde
</ResponseField>

<ResponseField name="conversation_id" type="integer">
  Die ID der mit dieser Nachricht verknüpften Konversation
</ResponseField>

<ResponseField name="message_id" type="integer">
  Die ID des Konversations-Nachrichteneintrags
</ResponseField>

<ResponseField name="whatsapp_message_id" type="integer">
  Die ID des WhatsApp-Nachrichteneintrags
</ResponseField>

<ResponseField name="message_sid" type="string">
  Die Twilio Message SID zur Sendungsverfolgung
</ResponseField>

<ResponseField name="session_status" type="object">
  Aktualisierter Session-Status nach dem Versand der Nachricht

  <Expandable title="Session-Status Eigenschaften">
    <ResponseField name="is_open" type="boolean">
      Ob das 24-Stunden-Fenster aktuell geöffnet ist
    </ResponseField>

    <ResponseField name="can_send_freeform" type="boolean">
      Ob aktuell Freiform-Nachrichten gesendet werden können
    </ResponseField>

    <ResponseField name="requires_template" type="boolean">
      Ob eine Template-Nachricht erforderlich ist
    </ResponseField>

    <ResponseField name="message" type="string">
      Menschlich lesbare Beschreibung des Session-Zustands
    </ResponseField>

    <ResponseField name="minutes_remaining" type="integer">
      Verbleibende Minuten im 24-Stunden-Fenster
    </ResponseField>

    <ResponseField name="expires_at" type="string">
      ISO-8601-Timestamp, wann die Session abläuft
    </ResponseField>
  </Expandable>
</ResponseField>

### Error Responses

<ResponseField name="402 Insufficient Balance">
  <Expandable title="Error Response">
    <ResponseField name="success" type="boolean">`false`</ResponseField>
    <ResponseField name="error" type="string">`Insufficient balance. Please top up your account.`</ResponseField>
    <ResponseField name="error_code" type="string">`INSUFFICIENT_BALANCE`</ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="403 Session Expired">
  <Expandable title="Error Response">
    <ResponseField name="success" type="boolean">`false`</ResponseField>
    <ResponseField name="error" type="string">Message indicating the 24-hour messaging window has expired</ResponseField>
    <ResponseField name="error_code" type="string">`SESSION_EXPIRED`</ResponseField>

    <ResponseField name="session_status" type="object">
      Current session status with `is_open`, `can_send_freeform`, `requires_template`, and `message` fields
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="404 Not Found">
  <Expandable title="Error Response">
    <ResponseField name="success" type="boolean">`false`</ResponseField>
    <ResponseField name="error" type="string">`Sender not found or does not belong to you`</ResponseField>
    <ResponseField name="error_code" type="string">`SENDER_NOT_FOUND`</ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="503 Sender Offline">
  <Expandable title="Error Response">
    <ResponseField name="success" type="boolean">`false`</ResponseField>
    <ResponseField name="error" type="string">Message indicating the sender is currently offline</ResponseField>
    <ResponseField name="error_code" type="string">`SENDER_OFFLINE`</ResponseField>
  </Expandable>
</ResponseField>

<RequestExample>
  ```bash cURL theme={null}
  curl -X POST "https://app.famulor.de/api/user/whatsapp/send-freeform" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "sender_id": 12,
      "recipient_phone": "+1234567890",
      "message": "Thank you for your inquiry! Our team will review your request and get back to you within 2 hours."
    }'
  ```

  ```javascript JavaScript theme={null}
  const response = await fetch(
    'https://app.famulor.de/api/user/whatsapp/send-freeform',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender_id: 12,
        recipient_phone: '+1234567890',
        message: 'Thank you for your inquiry! Our team will review your request and get back to you within 2 hours.'
      })
    }
  );

  const data = await response.json();
  console.log(data);
  ```

  ```python Python theme={null}
  import requests

  response = requests.post(
      'https://app.famulor.de/api/user/whatsapp/send-freeform',
      headers={
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
      },
      json={
          'sender_id': 12,
          'recipient_phone': '+1234567890',
          'message': 'Thank you for your inquiry! Our team will review your request and get back to you within 2 hours.'
      }
  )

  print(response.json())
  ```
</RequestExample>

<ResponseExample>
  ```json 200 Success theme={null}
  {
    "success": true,
    "conversation_id": 1234,
    "message_id": 567,
    "whatsapp_message_id": 890,
    "message_sid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "session_status": {
      "is_open": true,
      "can_send_freeform": true,
      "requires_template": false,
      "message": "Session open (23 hr 45 min remaining). Unlimited free-form messages allowed.",
      "minutes_remaining": 1425,
      "expires_at": "2026-02-25T10:30:00+00:00"
    }
  }
  ```

  ```json 402 Insufficient Balance theme={null}
  {
    "success": false,
    "error": "Insufficient balance. Please top up your account.",
    "error_code": "INSUFFICIENT_BALANCE"
  }
  ```

  ```json 403 Session Expired theme={null}
  {
    "success": false,
    "error": "The 24-hour messaging window is closed. Customer must reply first, or use a template message.",
    "error_code": "SESSION_EXPIRED",
    "session_status": {
      "is_open": false,
      "can_send_freeform": false,
      "requires_template": true,
      "message": "Session expired. Send a template or wait for customer to reply.",
      "expired_at": "2026-02-23T10:30:00+00:00"
    }
  }
  ```

  ```json 404 Sender Not Found theme={null}
  {
    "success": false,
    "error": "Sender not found or does not belong to you",
    "error_code": "SENDER_NOT_FOUND"
  }
  ```

  ```json 422 Invalid Phone theme={null}
  {
    "success": false,
    "error": "Invalid phone number format. Use E.164 format (e.g., +14155551234).",
    "error_code": "INVALID_PHONE"
  }
  ```

  ```json 503 Sender Offline theme={null}
  {
    "success": false,
    "error": "Sender is not online. Current status: Offline",
    "error_code": "SENDER_OFFLINE"
  }
  ```
</ResponseExample>

### 24-Hour Messaging Window

WhatsApp enforces a **24-hour messaging window** policy:

1. When a customer sends a message to your WhatsApp Business number, a 24-hour window opens.
2. During this window, you can send freeform messages without restrictions.
3. After the window expires, you must use a [template message](/api-reference/whatsapp/send-template) to re-initiate the conversation.
4. Each new customer message resets the 24-hour timer.

Use the [Session Status](/api-reference/whatsapp/session-status) endpoint to check whether a session is active before attempting to send a freeform message.

### Notes

* Maximum message length is **4,096 characters** (WhatsApp limit).
* The sender must be `online`. Offline senders return a `503` error.
* Message costs are automatically deducted from your account balance.
* Rate limit: 5 requests per second per user.
