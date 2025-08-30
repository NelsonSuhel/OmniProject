
import Link from 'next/link';
import { Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Suhel OmniProject</h3>
            <p className="text-sm">
              Una plataforma de e-learning de vanguardia para la formación profesional y la seguridad industrial.
            </p>
          </div>

          {/* Links Section */}
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Enlaces Rápidos</h3>
            <ul className="text-sm">
              <li className="mb-2"><Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link></li>
              <li className="mb-2"><Link href="/courses" className="hover:text-blue-600 dark:hover:text-blue-400">Cursos</Link></li>
              <li className="mb-2"><Link href="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400">Precios</Link></li>
              <li className="mb-2"><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">Dashboard</Link></li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Síguenos</h3>
            <div className="flex space-x-4">
              <a href="#" aria-label="Twitter" className="hover:text-blue-600 dark:hover:text-blue-400"><Twitter size={20} /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-blue-600 dark:hover:text-blue-400"><Linkedin size={20} /></a>
              <a href="#" aria-label="GitHub" className="hover:text-blue-600 dark:hover:text-blue-400"><Github size={20} /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Suhel OmniProject. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
