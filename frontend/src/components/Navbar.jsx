import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import GitHubIcon from "@mui/icons-material/GitHub";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import "./Navbar.css";

const pages = [
  { name: "Predict CGPA", path: "/" },
  { name: "NIT JSR Portal", path: "https://www.nitjsr.ac.in/", external: true },
  { name: "Terms and Conditions", path: "/terms-and-conditions" }
];

function ResponsiveAppBar() {
  const texts = ["CGPA Predictor", "NIT JSR"];
  const [textIndex, setTextIndex] = useState(0);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleMenuItemClick = () => {
    handleCloseNavMenu();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#111827" }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: "space-between", width: "100%" }}>
          
          {/* Hamburger on Left for Small Screens */}
          <Box sx={{ display: { xs: "flex", md: "none" }, mr: 1 }}>
            <IconButton
              size="large"
              edge="start"
              aria-label="menu"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElNav}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages
                .filter((page) => page.name !== "Predict CGPA")
                .map((page) => (
                  <MenuItem key={page.name} onClick={handleMenuItemClick}>
                    {page.external ? (
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {page.name}
                      </a>
                    ) : (
                      <Link
                        to={page.path}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {page.name}
                      </Link>
                    )}
                  </MenuItem>
                ))}

              {/* GitHub Repo in Mobile Menu */}
              <MenuItem onClick={handleMenuItemClick}>
                <a
                  href="https://github.com/Puzzling762/CGPA_Predictor" 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <GitHubIcon fontSize="small" />
                  GitHub Repo
                </a>
              </MenuItem>
            </Menu>
          </Box>

          {/* Animated Text (Centered) */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 900,
              color: "white",
              textDecoration: "none",
              letterSpacing: "0.05rem",
              fontSize: "1.3rem",
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            <span className="animated-text">{texts[textIndex]}</span>
          </Typography>

          {/* Desktop Navigation */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
            }}
          >
            {pages.map((page) =>
              page.external ? (
                <Button
                  key={page.name}
                  href={page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    my: 2,
                    mx: 2,
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "white",
                    "&:hover": { color: "#4ADE80", transform: "scale(1.05)" },
                    transition: "all 0.3s ease",
                  }}
                >
                  {page.name}
                </Button>
              ) : (
                <Button
                  key={page.name}
                  component={Link}
                  to={page.path}
                  sx={{
                    my: 2,
                    mx: 2,
                    fontSize: "0.95rem",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: location.pathname === page.path ? "#4ADE80" : "white",
                    "&:hover": { color: "#4ADE80", transform: "scale(1.05)" },
                    transition: "all 0.3s ease",
                  }}
                >
                  {page.name}
                </Button>
              )
            )}
          </Box>

          {/* GitHub Repo Button on Desktop */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
            <Button
              href="https://github.com/RajLucky" // Replace with your actual GitHub repo
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<GitHubIcon />}
              sx={{
                color: "white",
                textTransform: "none",
                fontWeight: "bold",
                fontSize: "0.9rem",
                "&:hover": {
                  color: "#60A5FA",
                  transform: "scale(1.05)",
                },
                transition: "all 0.3s ease",
              }}
            >
              GitHub Repo
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
