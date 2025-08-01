// components/layouts/Footer.tsx
const Footer = () => {
    return (
      <footer className="border-t">
        <div className="container flex h-16 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dorcas Cake Shop. All rights reserved.
          </p>
        </div>
      </footer>
    );
  };
  
  export default Footer;