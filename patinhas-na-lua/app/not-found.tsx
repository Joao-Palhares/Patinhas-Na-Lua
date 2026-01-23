import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <Image 
            src="/logo.png" 
            alt="Patinhas na Lua" 
            width={80} 
            height={80} 
            className="mx-auto rounded-xl"
          />
        </div>

        {/* 404 Display */}
        <div className="mb-6">
          <span className="text-8xl font-black text-gray-200">404</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Página não encontrada
        </h1>
        
        <p className="text-gray-500 mb-8">
          A página que procura não existe ou foi movida. 
          Verifique o endereço ou volte ao início.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md w-full sm:w-auto">
              🏠 Ir para o Início
            </button>
          </Link>
          
          <Link href="/dashboard">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition w-full sm:w-auto">
              📅 Minha Conta
            </button>
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          Patinhas na Lua • Estética Animal & Spa
        </p>
      </div>
    </div>
  );
}
