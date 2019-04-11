import * as ShowPlan from './showplan';
import QueryHelper from './query-helper';
import Convert from './convert';
import TagAndParser from './tag-and-parser';
import ScalarExpressionParser from './scalar-expression-parser';
import ObjectParser from './object-parser';
import SeekPredicateParser from './seek-predicate-parser';
import WarningsParser from './warnings-parser';
import ColumnReferenceParser from './column-reference-parser';
import MetaInfoParser from './meta-info-parser';

class RelOpParser {
    private static ScalarExpressionParser = new ScalarExpressionParser((parentRelOp: ShowPlan.RelOp | undefined, relOpElement: Element) => RelOpParser.ParseRelOp(parentRelOp, relOpElement));

    private static SeekPredicateParser = new SeekPredicateParser(element => RelOpParser.ScalarExpressionParser.Parse(element));

    private static MetaInfoParser = new MetaInfoParser();

    private static ObjectParser = new ObjectParser();

    private static WarningsParser = new WarningsParser();

    private static ColumnReferenceParser = new ColumnReferenceParser();

    public static ParseRelOp(parentRelOp: ShowPlan.RelOp | undefined, relOpElement: Element): ShowPlan.RelOp {
        const tagsAndParsers: TagAndParser<ShowPlan.RelOpAction>[] = [
            new TagAndParser('AdaptiveJoin', element => this.ParseAdaptiveJoin(element)),
            new TagAndParser('Assert', element => this.ParseFilterElement(element)),
            new TagAndParser('BatchHashTableBuild', element => this.ParseBatchHashTableBuild(element)),
            new TagAndParser('Bitmap', element => this.ParseBitmap(element)),
            new TagAndParser('Collapse', element => this.ParseCollapse(element)),
            new TagAndParser('ComputeScalar', element => this.ParseComputeScalar(element)),
            new TagAndParser('ConstantScan', element => this.ParseConstantScan(element)),
            new TagAndParser('Concat', element => this.ParseConcat(element)),
            new TagAndParser('CreateIndex', element => this.ParseCreateIndex(element)),
            new TagAndParser('DeletedScan', element => this.ParseRowSet(element)),
            new TagAndParser('Extension', element => this.ParseUDX(element)),
            new TagAndParser('Filter', element => this.ParseFilterElement(element)),
            new TagAndParser('ForeignKeyReferencesCheck', element => this.ParseForeignKeyReferencesCheckType(element)),
            new TagAndParser('Generic', element => this.ParseGeneric(element)),
            new TagAndParser('Hash', element => this.ParseHash(element)),
            new TagAndParser('InsertedScan', element => this.ParseRowSet(element)),
            new TagAndParser('LogRowScan', element => this.ParseRelOpBaseType(element)),
            new TagAndParser('Merge', element => this.ParseMerge(element)),
            new TagAndParser('MergeInterval', element => this.ParseSimpleIteratorOneChild(element)),
            new TagAndParser('NestedLoops', element => this.ParseNestedLoop(element)),
            new TagAndParser('OnlineIndex', element => this.ParseCreateIndex(element)),
            new TagAndParser('Parallelism', element => this.ParseParallelism(element)),
            new TagAndParser('ParameterTableScan', element => this.ParseRelOpBaseType(element)),
            new TagAndParser('PrintDataflow', element => this.ParseRelOpBaseType(element)), // i can't find this ANYWHERE online
            new TagAndParser('Put', element => this.ParsePut(element)),
            new TagAndParser('RemoteFetch', element => this.ParseRemoteFetch(element)),
            new TagAndParser('RemoteModify', element => this.ParseRemoteModify(element)),
            new TagAndParser('RemoteQuery', element => this.ParseRemoteQuery(element)),
            new TagAndParser('RemoteRange', element => this.ParseRemoteRange(element)),
            new TagAndParser('RemoteScan', element => this.ParseRemote(element)),
            new TagAndParser('RowCountSpool', element => this.ParseSpool(element)),
            new TagAndParser('ScalarInsert', element => this.ParseScalarInsert(element)),
            new TagAndParser('Segment', element => this.ParseSegment(element)),
            new TagAndParser('Sequence', element => this.ParseSequence(element)),
            new TagAndParser('SequenceProject', element => this.ParseComputeScalar(element)),
            new TagAndParser('SimpleUpdate', element => this.ParseSimpleUpdate(element)),
            new TagAndParser('Sort', element => this.ParseSort(element)),
            new TagAndParser('Split', element => this.ParseSplit(element)),
            new TagAndParser('Spool', element => this.ParseSpool(element)),
            new TagAndParser('StreamAggregate', element => this.ParseStreamAggregate(element)),
            new TagAndParser('Switch', element => this.ParseSwitch(element)),
            new TagAndParser('TableScan', element => this.ParseTableScan(element)),
            new TagAndParser('TableValuedFunction', element => this.ParseTableValuedFunction(element)),
            new TagAndParser('Top', element => this.ParseTopElement(element)),
            new TagAndParser('TopSort', element => this.ParseTopSort(element)),
            new TagAndParser('Update', element => this.ParseUpdate(element)),
            new TagAndParser('IndexScan', element => this.ParseIndexScan(element)),
            new TagAndParser('WindowSpool', element => this.ParseWindow(element)),
            new TagAndParser('WindowAggregate', element => this.ParseWindowAggregate(element)),
        ];

        /*
<xsd:element name="Generic" type="shp:GenericType"/>
<xsd:element name="Put" type="shp:PutType"/>

*/

        let action: ShowPlan.RelOpAction | undefined;
        let actionElement: Element | undefined;

        // eslint-disable-next-line
        for (const tagAndParser of tagsAndParsers) {
            const childNodes = QueryHelper.GetImmediateChildNodesByTagName(
                relOpElement,
                tagAndParser.TagName,
            );
            if (childNodes.length === 1) {
                [actionElement] = childNodes;
                action = tagAndParser.Action(actionElement);
                break;
            }
        }

        if (action !== undefined && actionElement !== undefined) {
            const definedValuesElement = QueryHelper.GetImmediateChildNodesByTagName(actionElement, 'DefinedValues');
            if (definedValuesElement.length === 1) {
                const definedValueElements = QueryHelper.GetImmediateChildNodesByTagName(definedValuesElement[0], 'DefinedValue');
                action.DefinedValues = definedValueElements.map(i => this.ParseDefinedValue(i));
            }
        } else {
            action = new ShowPlan.Generic();
        }

        const avgRowSize = Convert.GetInt(relOpElement, 'AvgRowSize');
        const EstimateCPU = Convert.GetFloat(relOpElement, 'EstimateCPU');
        const EstimatedTotalSubtreeCost = Convert.GetFloat(
            relOpElement,
            'EstimatedTotalSubtreeCost',
        );
        const EstimateIO = Convert.GetFloat(relOpElement, 'EstimateIO');
        const EstimateRebinds = Convert.GetFloat(relOpElement, 'EstimateRebinds');
        const EstimateRewinds = Convert.GetFloat(relOpElement, 'EstimateRewinds');
        const EstimateRows = Convert.GetFloat(relOpElement, 'EstimateRows');
        const LogicalOp = Convert.GetString(relOpElement, 'LogicalOp') as ShowPlan.LogicalOpType;
        const NodeId = Convert.GetInt(relOpElement, 'NodeId');
        const Parallel = Convert.GetBoolean(relOpElement, 'Parallel');
        const PhysicalOp = Convert.GetString(relOpElement, 'PhysicalOp') as ShowPlan.PhysicalOp;

        const columnReferenceList = RelOpParser.ColumnReferenceParser.GetAllFromElement(relOpElement, 'OutputList');

        const thisOp = new ShowPlan.RelOp(
            action,
            avgRowSize,
            EstimateCPU,
            EstimatedTotalSubtreeCost,
            EstimateIO,
            EstimateRebinds,
            EstimateRewinds,
            EstimateRows,
            LogicalOp,
            NodeId,
            Parallel,
            PhysicalOp,
            columnReferenceList,
        );
        thisOp.AdaptiveThresholdRows = Convert.GetFloatOrUndefined(relOpElement, 'AdaptiveThresholdRows');
        thisOp.EstimatedJoinType = Convert.GetStringOrUndefined(relOpElement, 'EstimatedJoinType') as ShowPlan.PhysicalOp;
        thisOp.Warnings = QueryHelper.ParseSingleItem(relOpElement, 'Warnings', i => RelOpParser.WarningsParser.ParseWarnings(i));
        thisOp.RunTimeInformation = QueryHelper.ParseSingleItem(relOpElement, 'RunTimeInformation', i => RelOpParser.MetaInfoParser.ParseRunTimeInformation(i));
        thisOp.ParentRelOp = parentRelOp;

        if (action !== undefined && actionElement !== undefined) {
            const childOpElements = QueryHelper.GetImmediateChildNodesByTagName(actionElement, 'RelOp');

            if (childOpElements.length > 0) {
                action.RelOp = childOpElements.map(element => this.ParseRelOp(thisOp, element));
            }
        }

        return thisOp;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseGeneric(element: Element): ShowPlan.Generic {
        return new ShowPlan.Generic();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseSequence(element: Element): ShowPlan.Sequence {
        return new ShowPlan.Sequence();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseConcat(element: Element): ShowPlan.Concat {
        return new ShowPlan.Concat();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseSimpleIteratorOneChild(element: Element): ShowPlan.SimpleIteratorOneChild {
        return new ShowPlan.SimpleIteratorOneChild();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseWindow(element: Element): ShowPlan.Window {
        return new ShowPlan.Window();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseWindowAggregate(element: Element): ShowPlan.WindowAggregate {
        return new ShowPlan.WindowAggregate();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseRelOpBaseType(element: Element): ShowPlan.RelOpAction {
        return new ShowPlan.RelOpAction();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static ParseConstantScan(element: Element): ShowPlan.ConstantScan {
        const scan = new ShowPlan.ConstantScan();
        // todo parse values. I can't find an example of this though
        return scan;
    }

    private static ParseRowSet(element: Element): ShowPlan.Rowset {
        const object = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object')
            .map(i => RelOpParser.ObjectParser.Parse(i));

        return new ShowPlan.Rowset(object);
    }

    private static ParseSwitch(element: Element): ShowPlan.Switch {
        const $switch = new ShowPlan.Switch();
        const predicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'Predicate');
        if (predicateElements.length === 1) {
            [$switch.Predicate] = predicateElements.map(i => RelOpParser.ScalarExpressionParser.Parse(i));
        }
        return $switch;
    }

    private static ParseCreateIndex(element: Element): ShowPlan.CreateIndex {
        const objectElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object');
        return new ShowPlan.CreateIndex(objectElement.map(i => RelOpParser.ObjectParser.Parse(i)));
    }

    private static ParseBitmap(element: Element): ShowPlan.Bitmap {
        const hashkeys = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'HashKeys');
        return new ShowPlan.Bitmap(hashkeys);
    }

    private static ParseForeignKeyReferencesCheckType(element: Element): ShowPlan.ForeignKeyReferencesCheck {
        const parseForeignKeyReferenceCheckElements = (fkElement: Element): ShowPlan.ForeignKeyReferenceCheck => {
            const indexScanElements = QueryHelper.GetImmediateChildNodesByTagName(fkElement, 'IndexScan');
            const indexScan = this.ParseIndexScan(indexScanElements[0]);
            return new ShowPlan.ForeignKeyReferenceCheck(indexScan);
        };

        const foreignKeyReferenceCheckElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'ForeignKeyReferenceCheck');
        const foreignKeyReferenceCheck = foreignKeyReferenceCheckElements.map(i => parseForeignKeyReferenceCheckElements(i));

        const check = new ShowPlan.ForeignKeyReferencesCheck(foreignKeyReferenceCheck);
        check.ForeignKeyReferencesCount = Convert.GetIntOrUndefined(element, 'ForeignKeyReferencesCount');
        check.NoMatchingIndexCount = Convert.GetIntOrUndefined(element, 'NoMatchingIndexCount');
        check.PartialMatchingIndexCount = Convert.GetIntOrUndefined(element, 'PartialMatchingIndexCount');

        return check;
    }

    private static ParseNestedLoop(element: Element): ShowPlan.NestedLoops {
        const optimized = Convert.GetBoolean(element, 'Optimized');
        const nestedLoop = new ShowPlan.NestedLoops(optimized);

        nestedLoop.Predicate = QueryHelper.ParseSingleItem(element, 'Predicate', i => RelOpParser.ScalarExpressionParser.Parse(i));
        nestedLoop.PassThru = QueryHelper.ParseSingleItem(element, 'PassThru', i => RelOpParser.ScalarExpressionParser.Parse(i));
        nestedLoop.WithOrderedPrefetch = Convert.GetBooleanOrUndefined(element, 'WithOrderedPrefetch');
        nestedLoop.WithUnorderedPrefetch = Convert.GetBooleanOrUndefined(element, 'WithUnorderedPrefetch');

        nestedLoop.OuterReferences = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'OuterReferences');

        return nestedLoop;
    }

    private static ParseBatchHashTableBuild(element: Element): ShowPlan.BatchHashTableBuild {
        const op = new ShowPlan.BatchHashTableBuild();
        op.BitmapCreator = Convert.GetBooleanOrUndefined(element, 'BitmapCreator');
        return op;
    }

    private static ParseSplit(element: Element): ShowPlan.Split {
        const split = new ShowPlan.Split();
        const actionColumns = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'ActionColumn');
        if (actionColumns.length === 1) {
            [split.ActionColumn] = actionColumns;
        }

        return split;
    }

    private static ParseUDX(element: Element): ShowPlan.UDX {
        const name = Convert.GetString(element, 'UDXName');
        const udx = new ShowPlan.UDX(name);

        udx.UsedUDXColumns = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'UsedUDXColumns');

        return udx;
    }

    private static ParseSegment(element: Element): ShowPlan.Segment {
        const groupBy = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'GroupBy');
        const segmentColumns = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'SegmentColumn');
        return new ShowPlan.Segment(groupBy, segmentColumns[0]);
    }

    private static ParseScalarInsert(element: Element): ShowPlan.ScalarInsert {
        const object = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object')
            .map(i => RelOpParser.ObjectParser.Parse(i));

        const insert = new ShowPlan.ScalarInsert(object);

        const setPredicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'SetPredicate');
        if (setPredicateElements.length === 1) {
            insert.SetPredicate = this.parseSetPredicateElementType(setPredicateElements[0]);
        }

        insert.DMLRequestSort = Convert.GetBooleanOrUndefined(element, 'DMLRequestSort');
        return insert;
    }

    private static ParseSimpleUpdate(element: Element): ShowPlan.SimpleUpdate {
        const object = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object')
            .map(i => RelOpParser.ObjectParser.Parse(i));

        const update = new ShowPlan.SimpleUpdate(object);

        const seekPredicateElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'SeekPredicate');
        if (seekPredicateElement.length === 1) {
            update.SeekPredicate = RelOpParser.SeekPredicateParser.ParseSeekPredicate(seekPredicateElement[0]);
        }

        const seekPredicateNewElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'SeekPredicateNew');
        if (seekPredicateNewElement.length === 1) {
            update.SeekPredicateNew = RelOpParser.SeekPredicateParser.ParseSeekPredicateNew(seekPredicateNewElement[0]);
        }

        const setPredicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'SetPredicate');
        if (setPredicateElements.length === 1) {
            update.SetPredicate = this.parseSetPredicateElementType(setPredicateElements[0]);
        }

        update.DMLRequestSort = Convert.GetBooleanOrUndefined(element, 'DMLRequestSort');
        return update;
    }

    private static ParseSpool(element: Element): ShowPlan.Spool {
        const spool = new ShowPlan.Spool();
        spool.Stack = Convert.GetBooleanOrUndefined(element, 'Stack');
        spool.PrimaryNodeId = Convert.GetIntOrUndefined(element, 'PrimaryNodeId');

        const seekPredicateElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'SeekPredicate');
        if (seekPredicateElement.length === 1) {
            spool.SeekPredicate = RelOpParser.SeekPredicateParser.ParseSeekPredicate(seekPredicateElement[0]);
        }

        const seekPredicateNewElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'SeekPredicateNew');
        if (seekPredicateNewElement.length === 1) {
            spool.SeekPredicateNew = RelOpParser.SeekPredicateParser.ParseSeekPredicateNew(seekPredicateNewElement[0]);
        }

        return spool;
    }

    private static ParseSort(element: Element): ShowPlan.Sort {
        const distinct = Convert.GetBoolean(element, 'Distinct');
        const orderByElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'OrderBy');
        const orderByColumnElements = QueryHelper.GetImmediateChildNodesByTagName(orderByElement[0], 'OrderByColumn');
        const orderBy = new ShowPlan.OrderBy(orderByColumnElements.map(i => this.parseOrderByColumn(i)));

        return new ShowPlan.Sort(distinct, orderBy);
    }

    private static parseOrderByColumn(element: Element): ShowPlan.OrderByTypeOrderByColumn {
        const ascending = Convert.GetBoolean(element, 'Ascending');
        const columnReferenceElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'ColumnReference');
        const columnReference = RelOpParser.ColumnReferenceParser.Parse(columnReferenceElement[0]);

        return new ShowPlan.OrderByTypeOrderByColumn(ascending, columnReference);
    }

    private static ParseTopSort(element: Element): ShowPlan.TopSort {
        const distinct = Convert.GetBoolean(element, 'Distinct');
        const orderByElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'OrderBy');
        const orderByColumnElements = QueryHelper.GetImmediateChildNodesByTagName(orderByElement[0], 'OrderByColumn');

        const orderBy = new ShowPlan.OrderBy(orderByColumnElements.map(i => this.parseOrderByColumn(i)));
        const rows = Convert.GetInt(element, 'Rows');

        const sort = new ShowPlan.TopSort(rows, distinct, orderBy);
        sort.WithTies = Convert.GetBooleanOrUndefined(element, 'WithTies');

        return sort;
    }

    private static ParseTableValuedFunction(element: Element): ShowPlan.TableValuedFunction {
        const tvf = new ShowPlan.TableValuedFunction();

        tvf.Object = QueryHelper.ParseSingleItem(element, 'Object', i => RelOpParser.ObjectParser.Parse(i));
        tvf.Predicate = QueryHelper.ParseSingleItem(element, 'Predicate', i => RelOpParser.ScalarExpressionParser.Parse(i));

        const parameterListElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'ParameterList');
        if (parameterListElements.length === 1) {
            const scalarElements = QueryHelper.GetImmediateChildNodesByTagName(parameterListElements[0], 'ScalarOperator');
            const scalars = scalarElements.map(i => RelOpParser.ScalarExpressionParser.ParseScalarType(i));
            tvf.ParameterList = new ShowPlan.ScalarExpressionList(scalars);
        }

        return tvf;
    }

    private static ParseMerge(element: Element): ShowPlan.Merge {
        const merge = new ShowPlan.Merge();
        merge.InnerSideJoinColumns = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'InnerSideJoinColumns');
        merge.OuterSideJoinColumns = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'OuterSideJoinColumns');

        const residualElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'Residual');
        if (residualElement.length === 1) {
            merge.Residual = RelOpParser.ScalarExpressionParser.Parse(residualElement[0]);
        }

        const passThruElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'PassThru');
        if (passThruElement.length === 1) {
            merge.PassThru = RelOpParser.ScalarExpressionParser.Parse(passThruElement[0]);
        }

        const starJoinElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'StarJoinInfo');
        if (starJoinElement.length === 1) {
            merge.StarJoinInfo = this.ParseStarJoinInfo(starJoinElement[0]);
        }

        merge.ManyToMany = Convert.GetBooleanOrUndefined(element, 'ManyToMany');
        return merge;
    }

    private static ParseAdaptiveJoin(element: Element): ShowPlan.AdaptiveJoin {
        const optimized = Convert.GetBoolean(element, 'Optimized');
        const adaptiveJoin = new ShowPlan.AdaptiveJoin(optimized);

        adaptiveJoin.HashKeysBuild = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'HashKeysBuild');
        adaptiveJoin.HashKeysProbe = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'HashKeysProbe');

        const buildResidualElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'BuildResidual');
        if (buildResidualElement.length === 1) {
            adaptiveJoin.BuildResidual = RelOpParser.ScalarExpressionParser.Parse(buildResidualElement[0]);
        }

        const probeElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'ProbeResidual');
        if (probeElement.length === 1) {
            adaptiveJoin.ProbeResidual = RelOpParser.ScalarExpressionParser.Parse(probeElement[0]);
        }

        const starJoinElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'StarJoinInfo');
        if (starJoinElement.length === 1) {
            adaptiveJoin.StarJoinInfo = this.ParseStarJoinInfo(starJoinElement[0]);
        }

        const passThruElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'BuildResidual');
        if (passThruElement.length === 1) {
            adaptiveJoin.PassThru = RelOpParser.ScalarExpressionParser.Parse(passThruElement[0]);
        }

        adaptiveJoin.OuterReferences = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'OuterReferences');
        const partitionIdElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'PartitionId');
        if (partitionIdElement.length === 1) {
            adaptiveJoin.PartitionId = RelOpParser.ColumnReferenceParser.Parse(partitionIdElement[0]);
        }

        adaptiveJoin.BitmapCreator = Convert.GetBooleanOrUndefined(element, 'BitmapCreator');

        return adaptiveJoin;
    }

    private static ParseStreamAggregate(element: Element): ShowPlan.StreamAggregate {
        const groupBy = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'GroupBy');

        const stream = new ShowPlan.StreamAggregate();
        stream.GroupBy = groupBy;

        const rollupElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'RollupInfo');
        if (rollupElements.length === 1) {
            const highestLevel = Convert.GetInt(rollupElements[0], 'HighestLevel');

            const rollupLevelElements = QueryHelper.GetImmediateChildNodesByTagName(rollupElements[0], 'RollupLevel');
            const rollUpInfos = rollupLevelElements.map((e) => {
                const level = Convert.GetInt(e, 'Level');
                return new ShowPlan.RollupLevel(level);
            });
            stream.RollupInfo = new ShowPlan.RollupInfo(highestLevel, rollUpInfos);
        }


        return stream;
    }

    private static ParseDefinedValue(element: Element): ShowPlan.DefinedValue {
        const definedValue = new ShowPlan.DefinedValue();

        const columnReferenceElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'ColumnReference');
        if (columnReferenceElements.length > 0) {
            definedValue.ColumnReference = columnReferenceElements.map(i => RelOpParser.ColumnReferenceParser.Parse(i));
        }

        const scalarOperatorElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'ScalarOperator');
        if (scalarOperatorElements.length === 1) {
            definedValue.ScalarOperator = RelOpParser.ScalarExpressionParser.ParseScalarType(scalarOperatorElements[0]);
        }

        return definedValue;
    }

    private static ParseTableScan(element: Element): ShowPlan.TableScan {
        const ordered = Convert.GetBoolean(element, 'Ordered');
        const object = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object')
            .map(i => RelOpParser.ObjectParser.Parse(i));
        const scan = new ShowPlan.TableScan(object, ordered);

        const predicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'Predicate');
        if (predicateElements.length === 1) {
            [scan.Predicate] = predicateElements.map(i => RelOpParser.ScalarExpressionParser.Parse(i));
        }

        const partitionIdElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'PartitionId');
        if (partitionIdElement.length === 1) {
            scan.PartitionId = RelOpParser.ColumnReferenceParser.Parse(partitionIdElement[0]);
        }

        const indexViewInfoElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'IndexedViewInfo');
        if (indexViewInfoElement.length === 1) {
            const objects = QueryHelper.GetImmediateChildNodesByTagName(indexViewInfoElement[0], 'Object');
            scan.IndexedViewInfo = objects.map(i => RelOpParser.ObjectParser.Parse(i));
        }

        scan.ForcedIndex = Convert.GetBooleanOrUndefined(element, 'ForcedIndex');
        scan.ForceScan = Convert.GetBooleanOrUndefined(element, 'ForceScan');
        scan.NoExpandHint = Convert.GetBooleanOrUndefined(element, 'NoExpandHint');
        scan.Storage = Convert.GetString(element, 'Storage') as ShowPlan.StorageType;

        return scan;
    }

    private static parseSetPredicateElementType(element: Element): ShowPlan.SetPredicateElement {
        const predicateElement = RelOpParser.ScalarExpressionParser.Parse(element) as ShowPlan.SetPredicateElement;
        predicateElement.SetPredicateType = Convert.GetStringOrUndefined(element, 'SetPredicateType') as ShowPlan.SetPredicateType;

        return predicateElement;
    }

    private static ParseUpdate(element: Element): ShowPlan.Update {
        const objects = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object').map(i => RelOpParser.ObjectParser.Parse(i));
        const update = new ShowPlan.Update(objects);
        const setPredicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'SetPredicate');
        if (setPredicateElements.length > 0) {
            update.SetPredicate = setPredicateElements.map(i => this.parseSetPredicateElementType(i));
        }

        const probeColumnElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'ProbeColumn');
        if (probeColumnElement.length === 1) {
            const column = QueryHelper.GetImmediateChildNodesByTagName(probeColumnElement[0], 'ColumnReference');
            update.ProbeColumn = RelOpParser.ColumnReferenceParser.Parse(column[0]);
        }

        const actionColumnElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'ActionColumn');
        if (actionColumnElement.length === 1) {
            const column = QueryHelper.GetImmediateChildNodesByTagName(actionColumnElement[0], 'ColumnReference');
            update.ActionColumn = RelOpParser.ColumnReferenceParser.Parse(column[0]);
        }

        const originalActionColumnElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'OriginalActionColumn');
        if (originalActionColumnElement.length === 1) {
            const column = QueryHelper.GetImmediateChildNodesByTagName(originalActionColumnElement[0], 'ColumnReference');
            update.OriginalActionColumn = RelOpParser.ColumnReferenceParser.Parse(column[0]);
        }

        update.WithOrderedPrefetch = Convert.GetBooleanOrUndefined(element, 'WithOrderedPrefetch');
        update.WithUnorderedPrefetch = Convert.GetBooleanOrUndefined(element, 'WithUnorderedPrefetch');
        update.DMLRequestSort = Convert.GetBooleanOrUndefined(element, 'DMLRequestSort');

        return update;
    }

    private static ParseCollapse(element: Element): ShowPlan.Collapse {
        return new ShowPlan.Collapse(RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'GroupBy'));
    }

    private static ParseHash(element: Element): ShowPlan.Hash {
        const hash = new ShowPlan.Hash();
        hash.HashKeysBuild = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'HashKeysBuild');
        hash.HashKeysProbe = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'HashKeysProbe');

        const probeElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'ProbeResidual');
        if (probeElement.length === 1) {
            hash.ProbeResidual = RelOpParser.ScalarExpressionParser.Parse(probeElement[0]);
        }

        const starJoinElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'StarJoinInfo');
        if (starJoinElement.length === 1) {
            hash.StarJoinInfo = this.ParseStarJoinInfo(starJoinElement[0]);
        }

        return hash;
    }

    private static ParseFilterElement(filterElement: Element): ShowPlan.RelOpAction {
        const startUpExpression = Convert.GetBoolean(filterElement, 'StartupExpression');
        const predicateElement = QueryHelper.GetImmediateChildNodesByTagName(filterElement, 'Predicate');
        const filter = new ShowPlan.Filter(startUpExpression, RelOpParser.ScalarExpressionParser.Parse(predicateElement[0]));
        if (filterElement.tagName.toUpperCase() === 'ASSERT') {
            filter.IsAssert = true;
        }

        return filter;
    }

    private static ParseComputeScalar(element: Element): ShowPlan.ComputeScalar {
        const op = new ShowPlan.ComputeScalar();
        op.ComputeSequence = Convert.GetBooleanOrUndefined(element, 'ComputeSequence');
        return op;
    }

    private static ParseParallelism(element: Element): ShowPlan.Parallelism {
        const parallelism = new ShowPlan.Parallelism();
        parallelism.InRow = Convert.GetBooleanOrUndefined(element, 'InRow');
        parallelism.LocalParallelism = Convert.GetBooleanOrUndefined(element, 'LocalParallelism');
        parallelism.Remoting = Convert.GetBooleanOrUndefined(element, 'Remoting');
        parallelism.PartitioningType = Convert.GetStringOrUndefined(element, 'PartitioningType') as ShowPlan.PartitionType;
        parallelism.HashKeys = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'HashKeys');
        parallelism.PartitionColumns = RelOpParser.ColumnReferenceParser.GetAllFromElement(element, 'PartitionColumns');

        const orderByElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'OrderBy');
        if (orderByElement.length > 0) {
            const orderByColumnElements = QueryHelper.GetImmediateChildNodesByTagName(orderByElement[0], 'OrderByColumn');
            const orderBy = new ShowPlan.OrderBy(orderByColumnElements.map(i => this.parseOrderByColumn(i)));
            parallelism.OrderBy = orderBy;
        }

        const predicateElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'Predicate');
        if (predicateElement.length > 0) {
            parallelism.Predicate = RelOpParser.ScalarExpressionParser.Parse(predicateElement[0]);
        }

        return parallelism;
    }

    private static ParseTopElement(topElement: Element): ShowPlan.Top {
        const isPercent = Convert.GetBooleanOrUndefined(topElement, 'IsPercent');
        const rowCount = Convert.GetBooleanOrUndefined(topElement, 'RowCount');
        const rows = Convert.GetIntOrUndefined(topElement, 'Rows');
        const withTies = Convert.GetBooleanOrUndefined(topElement, ' WithTies');
        const topExpressionElements = QueryHelper.GetImmediateChildNodesByTagName(topElement, 'TopExpression');

        const top = new ShowPlan.Top();
        top.IsPercent = isPercent;
        top.RowCount = rowCount;
        top.Rows = rows;
        top.WithTies = withTies;

        if (topExpressionElements.length === 1) {
            top.TopExpression = RelOpParser.ScalarExpressionParser.Parse(topExpressionElements[0]);
        }

        return top;
    }

    private static ParseIndexScan(element: Element): ShowPlan.IndexScan {
        const ordered = Convert.GetBoolean(element, 'Ordered');
        const objectElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'Object');
        const indexScan = new ShowPlan.IndexScan(objectElement.map(i => RelOpParser.ObjectParser.Parse(i)), ordered);

        const seekPredicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'SeekPredicates');
        if (seekPredicateElements.length === 1) {
            indexScan.SeekPredicates = RelOpParser.SeekPredicateParser.ParseSeekPredicates(seekPredicateElements[0]);
        }

        const predicateElements = QueryHelper.GetImmediateChildNodesByTagName(element, 'Predicate');
        if (predicateElements.length > 0) {
            indexScan.Predicate = predicateElements.map(i => RelOpParser.ScalarExpressionParser.Parse(i));
        }

        const partitionIdElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'PartitionId');
        if (partitionIdElement.length === 1) {
            indexScan.PartitionId = RelOpParser.ColumnReferenceParser.Parse(partitionIdElement[0]);
        }

        const indexViewInfoElement = QueryHelper.GetImmediateChildNodesByTagName(element, 'IndexedViewInfo');
        if (indexViewInfoElement.length === 1) {
            const objects = QueryHelper.GetImmediateChildNodesByTagName(indexViewInfoElement[0], 'Object');
            indexScan.IndexedViewInfo = objects.map(i => RelOpParser.ObjectParser.Parse(i));
        }

        indexScan.Lookup = Convert.GetBooleanOrUndefined(element, 'Lookup');
        indexScan.ScanDirection = Convert.GetStringOrUndefined(element, 'ScanDirection') as ShowPlan.OrderType;
        indexScan.ForcedIndex = Convert.GetBooleanOrUndefined(element, 'ForcedIndex');
        indexScan.NoExpandHint = Convert.GetBooleanOrUndefined(element, 'NoExpandHint');
        indexScan.Storage = Convert.GetStringOrUndefined(element, 'Storage') as ShowPlan.StorageType;
        indexScan.DynamicSeek = Convert.GetBooleanOrUndefined(element, 'DynamicSeek');

        return indexScan;
    }

    private static ParseStarJoinInfo(element: Element): ShowPlan.StarJoinInfo {
        const operationType = Convert.GetString(element, 'OperationType') as ShowPlan.StarJoinInfoTypeOperationType;
        const starJoin = new ShowPlan.StarJoinInfo(operationType);
        starJoin.Root = Convert.GetBooleanOrUndefined(element, 'Root');

        return starJoin;
    }

    /* remote types */
    private static ApplyRemoteAttributes<T extends ShowPlan.Remote>(element: Element, creator: (() => T)): T {
        const remote = creator();
        remote.RemoteDestination = Convert.GetStringOrUndefined(element, 'RemoveDestination');
        remote.RemoteSource = Convert.GetStringOrUndefined(element, 'RemoteSource');
        remote.RemoteObject = Convert.GetStringOrUndefined(element, 'RemoteObject');
        return remote;
    }

    private static ParseRemote(element: Element): ShowPlan.Remote {
        return this.ApplyRemoteAttributes(element, () => new ShowPlan.Remote());
    }

    private static ParseRemoteRange(element: Element): ShowPlan.RemoteRange {
        const range = this.ApplyRemoteAttributes<ShowPlan.RemoteRange>(element, () => new ShowPlan.RemoteRange());
        range.SeekPredicates = QueryHelper.ParseSingleItem(element, 'SeekPredicates', i => RelOpParser.SeekPredicateParser.ParseSeekPredicates(i));
        return range;
    }

    private static ParseRemoteFetch(element: Element): ShowPlan.RemoteFetch {
        return this.ApplyRemoteAttributes(element, () => new ShowPlan.RemoteFetch());
    }

    private static ParseRemoteModify(element: Element): ShowPlan.RemoteModify {
        const modify = this.ApplyRemoteAttributes(element, () => new ShowPlan.RemoteModify());
        modify.SetPredicate = QueryHelper.ParseSingleItem(element, 'SetPredicate', i => RelOpParser.ScalarExpressionParser.Parse(i));
        return modify;
    }

    private static ParseRemoteQuery(element: Element): ShowPlan.RemoteQuery {
        const query = this.ApplyRemoteAttributes(element, () => new ShowPlan.RemoteQuery());
        query.RemoteQuery = Convert.GetStringOrUndefined(element, 'RemoteQuery');
        return query;
    }

    private static ParsePut(element: Element): ShowPlan.Put {
        const query = this.ApplyRemoteAttributes(element, () => new ShowPlan.Put());
        query.RemoteQuery = Convert.GetStringOrUndefined(element, 'RemoteQuery');
        query.ShuffleColumn = Convert.GetStringOrUndefined(element, 'ShuffleColumn');
        query.ShuffleType = Convert.GetStringOrUndefined(element, 'ShuffleType');
        return query;
    }
}

export default RelOpParser;
