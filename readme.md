# showplan.js

showplan.js is a JavaScript library for parsing SQL Server SHOWPLAN XML files into a strongly
typed object.

[![npm version](https://badge.fury.io/js/showplan-js.svg)](https://badge.fury.io/js/showplan-js)

## Installation

Use NPM or YARN to install foobar.

```bash
yarn add showplan-js
```

## Usage

```typescript
import { ShowPlanParser } from 'showplan-js';
const plan = ShowPlanParser.Parse(showPlanXml);
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)
