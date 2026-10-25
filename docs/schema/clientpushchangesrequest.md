# ClientPushChangesRequest Schema

```txt
https://timelimit.io/ClientPushChangesRequest
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                                          |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------------------------------------- |
| Can be instantiated | Yes        | Unknown status | No           | Forbidden         | Forbidden             | none                | [ClientPushChangesRequest.schema.json](ClientPushChangesRequest.schema.json "open original schema") |

## ClientPushChangesRequest Type

`object` ([ClientPushChangesRequest](clientpushchangesrequest.md))

# ClientPushChangesRequest Properties

| Property                                | Type     | Required | Nullable       | Defined by                                                                                                                                                          |
| :-------------------------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [deviceAuthToken](#deviceauthtoken)     | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-properties-deviceauthtoken.md "https://timelimit.io/ClientPushChangesRequest#/properties/deviceAuthToken")      |
| [actions](#actions)                     | `array`  | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-properties-actions.md "https://timelimit.io/ClientPushChangesRequest#/properties/actions")                      |
| [desktopCheckpoint](#desktopcheckpoint) | `object` | Optional | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-desktopcheckpoint.md "https://timelimit.io/ClientPushChangesRequest#/properties/desktopCheckpoint") |

## deviceAuthToken



`deviceAuthToken`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-properties-deviceauthtoken.md "https://timelimit.io/ClientPushChangesRequest#/properties/deviceAuthToken")

### deviceAuthToken Type

`string`

## actions



`actions`

* is required

* Type: `object[]` ([ClientPushChangesRequestAction](clientpushchangesrequest-definitions-clientpushchangesrequestaction.md))

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-properties-actions.md "https://timelimit.io/ClientPushChangesRequest#/properties/actions")

### actions Type

`object[]` ([ClientPushChangesRequestAction](clientpushchangesrequest-definitions-clientpushchangesrequestaction.md))

## desktopCheckpoint



`desktopCheckpoint`

* is optional

* Type: `object` ([DesktopCheckpoint](clientpushchangesrequest-definitions-desktopcheckpoint.md))

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-desktopcheckpoint.md "https://timelimit.io/ClientPushChangesRequest#/properties/desktopCheckpoint")

### desktopCheckpoint Type

`object` ([DesktopCheckpoint](clientpushchangesrequest-definitions-desktopcheckpoint.md))

# ClientPushChangesRequest Definitions

## Definitions group ClientPushChangesRequestAction

Reference this group by using

```json
{"$ref":"https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction"}
```

| Property                          | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                                                         |
| :-------------------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [encodedAction](#encodedaction)   | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-encodedaction.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/encodedAction")   |
| [sequenceNumber](#sequencenumber) | `number` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-sequencenumber.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/sequenceNumber") |
| [integrity](#integrity)           | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-integrity.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/integrity")           |
| [type](#type)                     | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-type.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/type")                     |
| [userId](#userid)                 | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-userid.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/userId")                 |

### encodedAction



`encodedAction`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-encodedaction.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/encodedAction")

#### encodedAction Type

`string`

### sequenceNumber



`sequenceNumber`

* is required

* Type: `number`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-sequencenumber.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/sequenceNumber")

#### sequenceNumber Type

`number`

### integrity



`integrity`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-integrity.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/integrity")

#### integrity Type

`string`

### type



`type`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-type.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/type")

#### type Type

`string`

#### type Constraints

**enum**: the value of this property must be equal to one of the following values:

| Value        | Explanation |
| :----------- | :---------- |
| `"appLogic"` |             |
| `"child"`    |             |
| `"parent"`   |             |

### userId



`userId`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-clientpushchangesrequestaction-properties-userid.md "https://timelimit.io/ClientPushChangesRequest#/definitions/ClientPushChangesRequestAction/properties/userId")

#### userId Type

`string`

## Definitions group DesktopCheckpoint

Reference this group by using

```json
{"$ref":"https://timelimit.io/ClientPushChangesRequest#/definitions/DesktopCheckpoint"}
```

| Property                        | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                             |
| :------------------------------ | :------- | :------- | :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [id](#id)                       | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-desktopcheckpoint-properties-id.md "https://timelimit.io/ClientPushChangesRequest#/definitions/DesktopCheckpoint/properties/id")                       |
| [payloadSha256](#payloadsha256) | `string` | Required | cannot be null | [ClientPushChangesRequest](clientpushchangesrequest-definitions-desktopcheckpoint-properties-payloadsha256.md "https://timelimit.io/ClientPushChangesRequest#/definitions/DesktopCheckpoint/properties/payloadSha256") |

### id



`id`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-desktopcheckpoint-properties-id.md "https://timelimit.io/ClientPushChangesRequest#/definitions/DesktopCheckpoint/properties/id")

#### id Type

`string`

#### id Constraints

**maximum length**: the maximum number of characters for this string is: `128`

**minimum length**: the minimum number of characters for this string is: `1`

**pattern**: the string must match the following regular expression:&#x20;

```regexp
^[\x21-\x7E]+$
```

[try pattern](https://regexr.com/?expression=%5E%5B%5Cx21-%5Cx7E%5D%2B%24 "try regular expression with regexr.com")

### payloadSha256



`payloadSha256`

* is required

* Type: `string`

* cannot be null

* defined in: [ClientPushChangesRequest](clientpushchangesrequest-definitions-desktopcheckpoint-properties-payloadsha256.md "https://timelimit.io/ClientPushChangesRequest#/definitions/DesktopCheckpoint/properties/payloadSha256")

#### payloadSha256 Type

`string`

#### payloadSha256 Constraints

**pattern**: the string must match the following regular expression:&#x20;

```regexp
^[0-9a-f]{64}$
```

[try pattern](https://regexr.com/?expression=%5E%5B0-9a-f%5D%7B64%7D%24 "try regular expression with regexr.com")
