import { PackageSearch } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { getProxyImageUrl } from "@/utils/image";

export function ProductThumb({ src }: { src: string }) {
    const [err, setErr] = useState(false);
    const proxiedSrc = getProxyImageUrl(src);

    if (!proxiedSrc || err) {
        return (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <PackageSearch size={20} className="text-gray-300" />
            </div>
        );
    }

    return (
        <div className="relative w-12 h-12 flex-shrink-0">
            <Image
                src={proxiedSrc}
                alt="product-image"
                fill
                sizes="48px"
                className="object-contain rounded-lg"
                loading="lazy"
                unoptimized
                onError={() => setErr(true)}
            />
        </div>
    );
}