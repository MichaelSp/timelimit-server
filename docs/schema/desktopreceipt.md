# DesktopReceipt Schema

```txt
https://timelimit.io/DesktopReceipt
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                      |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [DesktopReceipt.schema.json](DesktopReceipt.schema.json "open original schema") |

## DesktopReceipt Type

`object` ([DesktopReceipt](desktopreceipt.md))

# DesktopReceipt Properties

| Property                            | Type     | Required | Nullable       | Defined by                                                                                                                       |
| :---------------------------------- | :------- | :------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| [id](#id)                           | `string` | Required | cannot be null | [DesktopReceipt](desktopreceipt-properties-id.md "https://timelimit.io/DesktopReceipt#/properties/id")                           |
| [payloadSha256](#payloadsha256)     | `string` | Required | cannot be null | [DesktopReceipt](desktopreceipt-properties-payloadsha256.md "https://timelimit.io/DesktopReceipt#/properties/payloadSha256")     |
| [acceptedThrough](#acceptedthrough) | `number` | Required | cannot be null | [DesktopReceipt](desktopreceipt-properties-acceptedthrough.md "https://timelimit.io/DesktopReceipt#/properties/acceptedThrough") |

## id



`id`

* is required

* Type: `string`

* cannot be null

* defined in: [DesktopReceipt](desktopreceipt-properties-id.md "https://timelimit.io/DesktopReceipt#/properties/id")

### id Type

`string`

## payloadSha256



`payloadSha256`

* is required

* Type: `string`

* cannot be null

* defined in: [DesktopReceipt](desktopreceipt-properties-payloadsha256.md "https://timelimit.io/DesktopReceipt#/properties/payloadSha256")

### payloadSha256 Type

`string`

## acceptedThrough



`acceptedThrough`

* is required

* Type: `number`

* cannot be null

* defined in: [DesktopReceipt](desktopreceipt-properties-acceptedthrough.md "https://timelimit.io/DesktopReceipt#/properties/acceptedThrough")

### acceptedThrough Type

`number`
