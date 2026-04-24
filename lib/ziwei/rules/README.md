# basis-v1 schema contract

`basis-v1.json` is the single source of truth for the MVP rule basis.

- `triggerConditions[]` item shape is `{ field, operator, value }`
- allowed `field` enums are normalized engine fields only
- allowed `operator` enums are `equals | includes | greater_than | less_than`
- allowed `conflictPolicy` enums are `highest_priority_wins | first_match | accumulate`
- allowed `topic` enums are `personality | relationship | careerWealth | summary`
- rule-basis.ts may load, validate, and re-export JSON, but must not redefine business rules separately
- fixture `expectedChartSnapshot` includes `lifePalace`, `bodyPalace`, `primaryStars`, `transformationSet`, and `palaceStarMatrix`

Current codebase note:

The product workflow is ready for continued implementation, but the rule content itself is still a bootstrap basis and should be replaced by the final audited v1 source before production launch.
