export default function UnderCon() {
    return (
        <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
            <div className="relative flex flex-col items-center justify-center min-h-[320px] w-full max-w-md rounded-2xl overflow-hidden border-4 border-yellow-400 bg-transparent p-8 shadow-2xl">
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `repeating-linear-gradient(-45deg, #facc15 0px, #facc15 20px, #ffffff 20px, #ffffff 40px)`
                    }}
                />
                <div className="absolute top-0 left-0 right-0 h-3 bg-yellow-400 animate-pulse" />
                <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <div className="text-6xl animate-bounce select-none">🚧</div>
                    <span className="inline-block bg-yellow-400 text-zinc-900 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        Em construção
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-zinc-900 uppercase tracking-tight leading-tight drop-shadow-sm">
                        Componente em<br />implantação em breve
                    </h2>
                    <p className="text-zinc-500 text-sm max-w-xs font-medium">
                        Estamos construindo algo incrível aqui. Volte em breve! ⚙️
                    </p>

                </div>
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-yellow-400 animate-pulse" />
                <style>{`@keyframes progress { from { width: 45%; } to { width: 75%; } }`}</style>
            </div>
        </div>
    );
}