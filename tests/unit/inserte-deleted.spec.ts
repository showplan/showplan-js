import { ShowPlanParser } from '@/parser/showplan-parser';
import * as ShowPlan from '@/parser/showplan';
import * as fs from 'fs';

describe('inserted-deleted.sqlplan', () => {
    let plan: ShowPlan.ShowPlanXML;

    beforeAll(() => {
        const file = 'tests/unit/plans/inserted-deleted-scan.sqlplan';
        const data = fs.readFileSync(file, 'utf16le');
        plan = ShowPlanParser.Parse(data);
    });

    test('first statement can parse', () => {
        const statement = plan.Batches[0].Statements[0] as ShowPlan.StmtSimple;
        expect(statement.QueryPlan!.RelOp.PhysicalOp).toBe('Table Update');
        expect(statement.QueryPlan!.RelOp.Action).toBeInstanceOf(ShowPlan.Update);
    });

    test('second statement can parse as inserted scan', () => {
        const statement = plan.Batches[0].Statements[1] as ShowPlan.StmtSimple;
        const op = statement.QueryPlan!
            .RelOp.Action // compute scalar
            .RelOp[0].Action // compute scalar
            .RelOp[0].Action // streamaggregate
            .RelOp[0];

        expect(op.PhysicalOp).toBe('Inserted Scan');
        expect(op.Action).toBeInstanceOf(ShowPlan.Rowset);
    });

    test('third statement can parse as deleted scan', () => {
        const statement = plan.Batches[0].Statements[2] as ShowPlan.StmtSimple;
        const op = statement.QueryPlan!
            .RelOp.Action // compute scalar
            .RelOp[0].Action // compute scalar
            .RelOp[0].Action // streamaggregate
            .RelOp[0];

        expect(op.PhysicalOp).toBe('Deleted Scan');
        expect(op.Action).toBeInstanceOf(ShowPlan.Rowset);
    });
});
