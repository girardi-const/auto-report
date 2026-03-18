export function FieldDisplay({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[9px] uppercase font-black tracking-[0.35em] text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-secondary">{value || '—'}</span>
        </div>
    );
}
