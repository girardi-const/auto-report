import CustomSignIn from '../../../components/CustomSignIn';

export default function SignInPage() {
    return (
        <div className="relative flex items-center justify-center min-h-[calc(100vh-100px)] bg-gray-50 overflow-hidden">
            {/* Decorative modern background blobs */}
            <div className="absolute top-[-5%] left-[-10%] w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full bg-primary/10 blur-[80px] md:blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full bg-[#403e3d]/5 blur-[80px] md:blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

            <div className="z-10 w-full relative">
                <CustomSignIn />
            </div>
        </div>
    );
}
