# SerializedDeleteCategoryAction Schema

```txt
https://timelimit.io/SerializedParentAction#/definitions/SerializedDeleteCategoryAction
```



| Abstract            | Extensible | Status         | Identifiable | Custom Properties | Additional Properties | Access Restrictions | Defined In                                                                                        |
| :------------------ | :--------- | :------------- | :----------- | :---------------- | :-------------------- | :------------------ | :------------------------------------------------------------------------------------------------ |
| Can be instantiated | No         | Unknown status | No           | Forbidden         | Forbidden             | none                | [SerializedParentAction.schema.json\*](SerializedParentAction.schema.json "open original schema") |

## SerializedDeleteCategoryAction Type

`object` ([SerializedDeleteCategoryAction](serializedparentaction-definitions-serializeddeletecategoryaction.md))

# SerializedDeleteCategoryAction Properties

| Property                  | Type     | Required | Nullable       | Defined by                                                                                                                                                                                                                           |
| :------------------------ | :------- | :------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [type](#type)             | `string` | Required | cannot be null | [SerializedParentAction](serializedparentaction-definitions-serializeddeletecategoryaction-properties-type.md "https://timelimit.io/SerializedParentAction#/definitions/SerializedDeleteCategoryAction/properties/type")             |
| [categoryId](#categoryid) | `string` | Required | cannot be null | [SerializedParentAction](serializedparentaction-definitions-serializeddeletecategoryaction-properties-categoryid.md "https://timelimit.io/SerializedParentAction#/definitions/SerializedDeleteCategoryAction/properties/categoryId") |

## type



`type`

* is required

* Type: `string`

* cannot be null

* defined in: [SerializedParentAction](serializedparentaction-definitions-serializeddeletecategoryaction-properties-type.md "https://timelimit.io/SerializedParentAction#/definitions/SerializedDeleteCategoryAction/properties/type")

### type Type

`string`

### type Constraints

**constant**: the value of this property must be equal to:

```json
"DELETE_CATEGORY"
```

## categoryId



`categoryId`

* is required

* Type: `string`

* cannot be null

* defined in: [SerializedParentAction](serializedparentaction-definitions-serializeddeletecategoryaction-properties-categoryid.md "https://timelimit.io/SerializedParentAction#/definitions/SerializedDeleteCategoryAction/properties/categoryId")

### categoryId Type

`string`
