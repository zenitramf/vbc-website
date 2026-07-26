import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type { Sermon } from "@/lib/sermons";

interface SermonsTableProps {
  sermons: Sermon[];
}

const columnHelper = createColumnHelper<Sermon>();

const formatPublishedDate = (publishedAt: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Los_Angeles",
  }).format(new Date(publishedAt));

const columns = [
  columnHelper.accessor("thumbnailUrl", {
    cell: (info) => {
      const sermon = info.row.original;

      return (
        <img
          alt=""
          aria-hidden="true"
          className="h-14 w-24 rounded-sm object-cover"
          height={56}
          src={sermon.thumbnailUrl}
          width={96}
        />
      );
    },
    header: "Thumbnail",
    id: "thumbnail",
  }),
  columnHelper.accessor("title", {
    cell: (info) => (
      <div className="min-w-48 whitespace-normal">
        <p className="font-medium text-foreground">{info.getValue()}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatPublishedDate(info.row.original.publishedAt)}
        </p>
      </div>
    ),
    header: "Sermon",
  }),
  columnHelper.accessor("speaker", {
    cell: (info) => (
      <span className="text-muted-foreground">{info.getValue()}</span>
    ),
    header: "Speaker",
  }),
  columnHelper.display({
    cell: (info) => (
      <a
        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:ring-3 focus-visible:ring-outline/50 focus-visible:outline-none"
        href={info.row.original.youtubeUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Play
      </a>
    ),
    header: "",
    id: "play",
  }),
];

export default function SermonsTable({ sermons }: SermonsTableProps) {
  const table = useReactTable({
    columns,
    data: sermons,
    getCoreRowModel: getCoreRowModel(),
  });

  if (sermons.length === 0) {
    return (
      <p className="text-muted-foreground leading-relaxed">
        Sermon archives will appear here after the next sync. Check back soon.
      </p>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm" role="table">
        <thead className="[&_tr]:border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              className="border-b border-border"
              key={headerGroup.id}
              role="row"
            >
              {headerGroup.headers.map((header) => (
                <th
                  className="h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                  key={header.id}
                  role="columnheader"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {table.getRowModel().rows.map((row) => (
            <tr
              className="border-b border-border transition-colors hover:bg-muted/40"
              key={row.id}
              role="row"
            >
              {row.getVisibleCells().map((cell) => (
                <td className="p-2 align-middle" key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
