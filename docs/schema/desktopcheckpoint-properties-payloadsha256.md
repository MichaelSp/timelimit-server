# Untitled string in DesktopCheckpoint Schema

```txt
https://timelimit.io/DesktopCheckpoint#/properties/payloadSha256
```



| Abstract            | Extensible | Status         | Identifiable            | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                              |
| :------------------ | :--------- | :------------- | :---------------------- | :---------------- | :-------------------- | :------------------ | :-------------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | Unknown identifiability | Forbidden         | Allowed               | none                | [DesktopCheckpoint.schema.json\*](DesktopCheckpoint.schema.json "open original schema") |

## payloadSha256 Type

`string`

## payloadSha256 Constraints

**pattern**: the string must match the following regular expression:&#x20;

```regexp
^[0-9a-f]{64}$
```

[try pattern](https://regexr.com/?expression=%5E%5B0-9a-f%5D%7B64%7D%24 "try regular expression with regexr.com")
