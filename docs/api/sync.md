# /sync

This endpoint is used by clients for syncing.

## the sync process

- the client pushes all actions (eventually in chunks)
  - all actions are numbered so that the server can ignore it if the client sends an action multiple times (e.g. due to connectivity issues)
  - in case something goes wrong, the server asks the client to do a full query when pulling the status the next time
- the client pulls the status
  - the client sends a summary of the current status
  - the server does not send the data which the client already knows
- in case the client is unauthorized, then the client checks against /sync/is-device-removed
  - if it tells the client that it was really removed, then the client resets itself

## possible sync triggers

- periodically/ by the time (e.g. every hour, not all 10 seconds)
- the [websocket](./websocket.md) for syncing as soon as something was changed by an other client
- changes/ actions at the client itself

## POST /sync/push-actions

Use this to sync actions to the server.

### request

see [this JSON schema](../schema/clientpushchangesrequest.md)

the encoded actions are stringified JSON objects of one of this schemes:

- [serialized app logic action](../schema/serializedapplogicaction.md)
- [serialized parent action](../schema/serializedparentaction.md)
- [serialized child action](../schema/serializedchildaction.md)

The request must not contain more than 50 actions. The request may contain less than 50
actions.

#### desktop inventory (optional)

Desktop clients that have negotiated `desktopSync: { "version": 1 }` may send
the app-logic action `UPDATE_DESKTOP_INVENTORY` with one non-empty base64
`data` field. `data` is an opaque format-3 ciphertext, not JSON or an Android
base/diff container. Its decoded size is limited to 512 KiB. The server only
stores and forwards this ciphertext; it never decrypts or exposes plaintext.
The sending device must already have reported `platformType: "desktop"` and
`platformLevel >= 1` via `UPDATE_DEVICE_STATUS`; other devices are rejected.

On pull, an opted-in client reports the last seen per-device `appsI` version in
`devicesDetail`. Changed data is delivered only to opted-in clients as
`devices2[].desktopInventory: { version, data }`. Legacy Android `appsB` and
`appsD` payloads are unchanged.

The sequence numbers must be a increasing sequence per device.

#### desktop checkpoint (optional)

Desktop clients may add `desktopCheckpoint` to make a push idempotent as one
whole batch:

```json
{
  "id": "desktop-20260922-01",
  "payloadSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

`id` is 1 through 128 printable ASCII characters. `payloadSha256` is a
lowercase, 64-character SHA-256 hex digest. A repeated checkpoint with the
same id and digest returns its original receipt without applying actions
again. Reusing an id with another digest returns HTTP 409 Conflict.

#### integrity

The integrity field of a action may have got one of the following values:

- an empty string when no user authentication is required/ for app logic actions (e.g. incrementing the used time)
- the string `device` in case of parent actions if a parent is assigned to the device and asking for the password was disabled
- `sha512(sequence number as string with the base 10 + the device id as string + the hash of the user password using the second salt as string + the encoded action as string)` for parent and child actions
- the string `childDevice` in case the child wants to add limits for itself using parent actions; this feature must be enabled for the child and this allows only some actions with some parameters

In case of a invalid integrity value, the action is ignored and the client is told to do a full sync

### response

On a invalid request body: HTTP status code 400 Bad request

On a invalid auth token: HTTP status code 401 Unauthorized

On success: JSON object with the property `shouldDoFullSync` - example: `{"shouldDoFullSync": false}`.
When `desktopCheckpoint` was supplied, the response additionally contains:

```json
{
  "desktopReceipt": {
    "id": "desktop-20260922-01",
    "payloadSha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "acceptedThrough": 42
  }
}
```

`acceptedThrough` is the last client action sequence number accepted by the
server for that checkpoint.

### error handling

If a action has got a invalid `integrity` or `encodedAction`, then only this action
is ignored and `shouldDoFullSync` will be true.

## POST /sync/pull-status

Use this to pull the current status from the server.

### request

see [this JSON schema](../schema/clientpullchangesrequest.md)

### response

On a invalid request body: HTTP status code 400 Bad request

On a invalid auth token: HTTP status code 401 Unauthorized

On success: see [this JSON schema](../schema/serverdatastatus.md). Responses
also include the optional `desktopSync: { "version": 1 }` descriptor; legacy
clients may ignore it, while desktop policy clients require exactly that shape.

## POST /sync/report-removed

Use this to report that TimeLimit is/ was reset.

### request

see [this JSON schema](../schema/requestwithauthtoken.md)

### response

On a invalid request body: http status code 400 Bad request

On a invalid/ unknown auth token: http status code 500 Internal Server Error

On success: `{"ok": true}`

### error handling

If a removed device reports that it is removed, then it is ignored and handled
as success.

## POST /sync/is-device-removed

Use this to check if the device was removed.

Background: This checks if the auth token is in a list of known old auth tokens.
This ensures that an empty database at the server does not trigger the client reset feature.

### request

see [this JSON schema](../schema/requestwithauthtoken.md)

### response

On a invalid request body: http status code 400 bad request

object with the property `isDeviceRemoved` of the type boolean

example response: `{"isDeviceRemoved": false}`
