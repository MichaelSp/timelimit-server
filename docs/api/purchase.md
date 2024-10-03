# /purchase

This endpoint is used for handling purchases from the client.
It currently only supports purchases using Google Play in app purchases.

## see

- [premium concept](../concept/premium.md)

## POST /purchase/can-do-purchase

Use this before a purchase to check if a purchase is possible.

### request

see [this JSON schema](../schema/candopurchaserequest.md)

### response

On a invalid request body: HTTP status code 400 Bad request

On a invalid auth token: HTTP status code 401 Unauthorized

On success: a JSON object with the property `canDoPurchase` (string) and `googlePlayPublicKey` (string, base64)

possible values of `canDoPurchase`:

- `yes`
- `no due to old purchase`
- `no because not supported by the server`

The `googlePlayPublicKey` is the key by which purchases using google play should be signed.

## POST /purchase/finish-purchase-by-google-play

Use this to report a purchase to the server/ unlock all features after a purchase
using Google Play.

### request

see [this JSON schema](../schema/finishpurchasebygoogleplayrequest.md)

### response

On a invalid request body: HTTP status code 400 Bad request

On a invalid auth token: HTTP status code 401 Unauthorized

On a invalid purchase: HTTP status code 409 Conflict

On success: `{"ok": true}`

### error handling

- if the purchase was already added (for the same or an other family), then this request is ignored and success is returned
