import * as ShowPlan from './showplan';
import Convert from './convert';
import QueryHelper from './query-helper';

class ColumnReferenceParser {
    public Parse(element: Element): ShowPlan.ColumnReference {
        const column = Convert.GetString(element, 'Column');
        const columnReference = new ShowPlan.ColumnReference(column);

        columnReference.Server = Convert.GetStringOrUndefined(element, 'Server');
        columnReference.Database = Convert.GetStringOrUndefined(element, 'Database');
        columnReference.Schema = Convert.GetStringOrUndefined(element, 'Schema');
        columnReference.Table = Convert.GetStringOrUndefined(element, 'Table');
        columnReference.Alias = Convert.GetStringOrUndefined(element, 'Alias');
        columnReference.ComputedColumn = Convert.GetBooleanOrUndefined(element, 'ComputedColumn');
        columnReference.ParameterDataType = Convert.GetStringOrUndefined(element, 'ParameterDataType');
        columnReference.ParameterCompiledValue = Convert.GetStringOrUndefined(element, 'ParameterCompiledValue');
        columnReference.ParameterRuntimeValue = Convert.GetStringOrUndefined(element, 'ParameterRuntimeValue');

        // todo set InternalInfo and ScalarOperator

        return columnReference;
    }

    public GetAllFromElement(parentElement: Element, elementName: string): ShowPlan.ColumnReference[] {
        const containerElement = QueryHelper.GetImmediateChildNodesByTagName(parentElement, elementName);
        if (containerElement.length !== 1) {
            return [];
        }

        const columnReferenceElements = QueryHelper.GetImmediateChildNodesByTagName(containerElement[0], 'ColumnReference');
        return columnReferenceElements.map(i => this.Parse(i));
    }
}

export default ColumnReferenceParser;
