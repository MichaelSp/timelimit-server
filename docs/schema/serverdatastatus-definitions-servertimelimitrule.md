# ServerTimeLimitRule Schema

```txt
https://timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule
```




| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                            |
| :------------------ | ---------- | -------------- | ------------ | :---------------- | --------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [ServerDataStatus.schema.json\*](ServerDataStatus.schema.json "open original schema") |

## ServerTimeLimitRule Type

`object` ([ServerTimeLimitRule](serverdatastatus-definitions-servertimelimitrule.md))

# ServerTimeLimitRule Properties

| Property                | Type      | Required | Nullable       | Defined by                                                                                                                                                                                      |
| :---------------------- | --------- | -------- | -------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [id](#id)               | `string`  | Required | cannot be null | [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-id.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/id")               |
| [extraTime](#extraTime) | `boolean` | Required | cannot be null | [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-extratime.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/extraTime") |
| [dayMask](#dayMask)     | `number`  | Required | cannot be null | [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-daymask.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/dayMask")     |
| [maxTime](#maxTime)     | `number`  | Required | cannot be null | [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-maxtime.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/maxTime")     |

## id




`id`

-   is required
-   Type: `string`
-   cannot be null
-   defined in: [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-id.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/id")

### id Type

`string`

## extraTime




`extraTime`

-   is required
-   Type: `boolean`
-   cannot be null
-   defined in: [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-extratime.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/extraTime")

### extraTime Type

`boolean`

## dayMask




`dayMask`

-   is required
-   Type: `number`
-   cannot be null
-   defined in: [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-daymask.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/dayMask")

### dayMask Type

`number`

## maxTime




`maxTime`

-   is required
-   Type: `number`
-   cannot be null
-   defined in: [ServerDataStatus](serverdatastatus-definitions-servertimelimitrule-properties-maxtime.md "https&#x3A;//timelimit.io/ServerDataStatus#/definitions/ServerTimeLimitRule/properties/maxTime")

### maxTime Type

`number`