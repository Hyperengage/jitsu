import omit from "lodash/omit";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Table } from "antd";
import hash from "stable-hash";

function makeNiceName(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export type TypedColumn =
  | {
      type: "number";
    }
  | { type: "link"; href: (val, row) => string };
export type ColumnOption = { omit: true; type?: unknown } | ({ omit?: false | undefined } & TypedColumn);
export const JsonAsTable: React.FC<{ rows: any[]; columnOptions: Record<string, ColumnOption> }> = ({
  rows,
  columnOptions,
}) => {
  const columnsMeta: Record<string, any> = {};
  const omitColumns = columnOptions
    ? Object.entries(columnOptions)
        .filter(([_, v]) => v.omit)
        .map(([k, _]) => k)
    : [];
  for (const row of rows) {
    const displayKeys = Object.keys(omit({ ...row }, omitColumns));
    for (const key of displayKeys) {
      if (!columnsMeta[key]) {
        const columnType = columnOptions[key];
        const isNumber = columnType?.type === "number";
        columnsMeta[key] = {
          key: key,
          title: <span className="whitespace-nowrap">{makeNiceName(key)}</span>,
          render: (row: any) => {
            return (
              <div className={`whitespace-nowrap text-sm ${isNumber ? "text-right font-mono" : ""}`}>
                {(() => {
                  const val = row[key];
                  if (isNumber) {
                    return new Intl.NumberFormat("en-US").format(val);
                  } else if (columnType?.type === "link") {
                    return (
                      <Link
                        className="inline-flex items-center space-x-2 font-xs"
                        href={(columnType as any).href(val, row)}
                      >
                        {val} <ExternalLink className="w-3" />
                      </Link>
                    );
                  } else {
                    return typeof val === "undefined" ? "" : typeof val === "object" ? JSON.stringify(val) : `${val}`;
                  }
                })()}
              </div>
            );
          },
          sorter: isNumber
            ? (a: number, b: number) => a[key] - b[key]
            : (a, b) => (a?.[key] ? `${a?.[key]}` : "").localeCompare(b?.[key] ? `${b?.[key]}` : ""),
        };
      }
    }
  }
  return (
    <Table
      size="small"
      columns={Object.values(columnsMeta)}
      dataSource={rows.map(r => ({ key: hash(r), ...r }))}
      pagination={{ pageSize: 1000 }}
      expandable={{
        expandedRowRender: row => <pre>{JSON.stringify(omit(row, "key"), null, 2)}</pre>,
      }}
    />
  );
};
