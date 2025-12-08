import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">HIVE CONSULT</h3>
            <p className="text-sm opacity-90">
              Sustainable tote bags made from eco-friendly materials. 
              Shop guilt-free with our 100% recyclable products.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/store" className="hover:underline opacity-90 hover:opacity-100">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:underline opacity-90 hover:opacity-100">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:underline opacity-90 hover:opacity-100">
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <p className="text-sm opacity-90">
              Email: hello@anase.eco<br />
              Phone: (555) 123-4567<br />
              Address: 123 Green St, Eco City
            </p>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm opacity-75">
          <p>&copy; 2025 HIVE CONSULT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
