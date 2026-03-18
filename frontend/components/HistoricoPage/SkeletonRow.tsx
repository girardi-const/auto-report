export function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: [200, 100, 80, 100, 80][i] }} />
                </td>
            ))}
        </tr>
    );
}
