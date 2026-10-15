# DesktopCheckpoint Schema

```txt
https://timelimit.io/DesktopCheckpoint
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                            |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [DesktopCheckpoint.schema.json](DesktopCheckpoint.schema.json "open original schema") |

## DesktopCheckpoint Type

`object` ([DesktopCheckpoint](desktopcheckpoint.md))

# DesktopCheckpoint Properties

| Property                        | Type     | Required | Nullable       | Defined by                                                                                                                            |
| :------------------------------ | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| [id](#id)                       | `string` | Required | cannot be null | [DesktopCheckpoint](desktopcheckpoint-properties-id.md "https://timelimit.io/DesktopCheckpoint#/properties/id")                       |
| [payloadSha256](#payloadsha256) | `string` | Required | cannot be null | [DesktopCheckpoint](desktopcheckpoint-properties-payloadsha256.md "https://timelimit.io/DesktopCheckpoint#/properties/payloadSha256") |

## id



`id`

* is required

* Type: `string`

* cannot be null

* defined in: [DesktopCheckpoint](desktopcheckpoint-properties-id.md "https://timelimit.io/DesktopCheckpoint#/properties/id")

### id Type

`string`

### id Constraints

**maximum length**: the maximum number of characters for this string is: `128`

**minimum length**: the minimum number of characters for this string is: `1`

**pattern**: the string must match the following regular expression:&#x20;

```regexp
^[\x21-\x7E]+$
```

[try pattern](https://regexr.com/?expression=%5E%5B%5Cx21-%5Cx7E%5D%2B%24 "try regular expression with regexr.com")

## payloadSha256



`payloadSha256`

* is required

* Type: `string`

* cannot be null

* defined in: [DesktopCheckpoint](desktopcheckpoint-properties-payloadsha256.md "https://timelimit.io/DesktopCheckpoint#/properties/payloadSha256")

### payloadSha256 Type

`string`

### payloadSha256 Constraints

**pattern**: the string must match the following regular expression:&#x20;

```regexp
^[0-9a-f]{64}$
```

[try pattern](https://regexr.com/?expression=%5E%5B0-9a-f%5D%7B64%7D%24 "try regular expression with regexr.com")
