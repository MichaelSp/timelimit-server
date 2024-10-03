# RequestIdentityTokenRequest Schema

```txt
https://timelimit.io/RequestIdentityTokenRequest
```

| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                                                |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [RequestIdentityTokenRequest.schema.json](RequestIdentityTokenRequest.schema.json "open original schema") |

## RequestIdentityTokenRequest Type

`object` ([RequestIdentityTokenRequest](requestidentitytokenrequest.md))

# RequestIdentityTokenRequest Properties

| Property                                              | Type     | Required | Nullable       | Defined by                                                                                                                                                                                |
| :---------------------------------------------------- | :------- | :------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [deviceAuthToken](#deviceauthtoken)                   | `string` | Required | cannot be null | [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-deviceauthtoken.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/deviceAuthToken")                   |
| [parentUserId](#parentuserid)                         | `string` | Required | cannot be null | [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-parentuserid.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/parentUserId")                         |
| [parentPasswordSecondHash](#parentpasswordsecondhash) | `string` | Required | cannot be null | [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-parentpasswordsecondhash.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/parentPasswordSecondHash") |
| [purpose](#purpose)                                   | `string` | Required | cannot be null | [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-purpose.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/purpose")                                   |

## deviceAuthToken

`deviceAuthToken`

- is required

- Type: `string`

- cannot be null

- defined in: [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-deviceauthtoken.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/deviceAuthToken")

### deviceAuthToken Type

`string`

## parentUserId

`parentUserId`

- is required

- Type: `string`

- cannot be null

- defined in: [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-parentuserid.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/parentUserId")

### parentUserId Type

`string`

## parentPasswordSecondHash

`parentPasswordSecondHash`

- is required

- Type: `string`

- cannot be null

- defined in: [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-parentpasswordsecondhash.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/parentPasswordSecondHash")

### parentPasswordSecondHash Type

`string`

## purpose

`purpose`

- is required

- Type: `string`

- cannot be null

- defined in: [RequestIdentityTokenRequest](requestidentitytokenrequest-properties-purpose.md "https://timelimit.io/RequestIdentityTokenRequest#/properties/purpose")

### purpose Type

`string`

### purpose Constraints

**constant**: the value of this property must be equal to:

```json
"purchase"
```
