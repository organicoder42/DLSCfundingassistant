export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Danish Life Science Cluster. All rights reserved.</p>
          </div>
          <div className="flex space-x-6 text-sm text-gray-600">
            <a
              href="https://www.danishlifesciencecluster.dk/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              About DLSC
            </a>
            <a
              href="mailto:info@dlsc.dk"
              className="hover:text-gray-900"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
