# /admin

This endpoint is for the server admin.

Due to that, it requires authentication using the HTTP basic authentication.
The username can be anything, the password must be the configured admin token.

Additionally, this endpoint allows cross origin requests.

## GET /admin/status

Use this to get the server status.

## Response

This returns a JSON object with ``websocketClients`` (of the type number,
the number of clients connected using the websocket) and the map ``counters``
which maps values to numbers. You should not make any assumptions about the counter names
and their availability.

### example response

```
{
  "websocketClients": 3,
  "counters": {
    "testCounter": 1
  }
}
```

## POST /admin/reset-counters

Use this to reset the counters included in the server status.

Although this uses POST, it does not take any request body

Response: ``{"ok": true}``

## GET /admin/status-message

Use this to get the current status message.

This returns a object with the key ``statusMessage`` whose value
of the type string is the current status message.

Example response: ``{"statusMessage":""}``

### see

- [status message concept](../concept/status-message.md)

## POST /admin/status-message

Use this to set the status message.

Request body: object with ``message`` (string)

Response: ``{"ok": true}``

### see

- [status message concept](../concept/status-message.md)

## POST /admin/unlock-premium

Use this to unlock all features for one user for a specified duration.

### request

request properties: ``mail`` and ``duration``

- ``duration`` must be ``year`` or ``month``
- ``mail`` must be a mail address of any user assigned to the family for which the features should be unlocked

### response

If everything worked:

``{"ok": true}``

If the duration was invalid or no mail address was specified: HTTP status code 400 Bad Request

If there was nothing found for the mail address: HTTP status code 409 Conflict

### see

- [premium concept](../concept/premium.md)
