import React, { useState, useEffect } from 'react';
import {
  Button,
  Container,
  Typography,
  Box,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  Tabs,
  Tab,
  Drawer,
  ListItemIcon,
  IconButton,
  AppBar,
  Toolbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [latestInvoice, setLatestInvoice] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [authTab, setAuthTab] = useState(0);
  const [authData, setAuthData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState('invoices');

  // Axios interceptor for adding auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setUsername(localStorage.getItem('username'));
      fetchInvoices();
    }
  }, []);

  const handleAuthTabChange = (event, newValue) => {
    setAuthTab(newValue);
    setError(null);
  };

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/register', authData);
      setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
      setAuthTab(0);
      setAuthData({ username: '', email: '', password: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5001/api/login', {
        email: authData.email,
        password: authData.password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setIsAuthenticated(true);
      setUsername(response.data.username);
      setAuthData({ username: '', email: '', password: '' });
      fetchInvoices();
    } catch (error) {
      setError(error.response?.data?.message || 'Giriş sırasında bir hata oluştu');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUsername('');
    setInvoices([]);
    setLatestInvoice(null);
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/invoices');
      if (response.data.length > 0) {
        setLatestInvoice(response.data[0]);
        setInvoices(response.data.slice(1));
      } else {
        setLatestInvoice(null);
        setInvoices([]);
      }
    } catch (error) {
      setError('Faturalar yüklenirken bir hata oluştu.');
      console.error('Error fetching invoices:', error);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Lütfen bir dosya seçin.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Dosya başarıyla yüklendi!');
      setSelectedFile(null);
      fetchInvoices();
    } catch (error) {
      setError(error.response?.data?.message || 'Dosya yüklenirken bir hata oluştu.');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderInvoiceDetails = (invoice) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
      <Chip 
        label={`Fatura No: ${invoice.ocrData?.faturaNo || 'Bulunamadı'}`} 
        variant="outlined" 
      />
      <Chip 
        label={`Fatura Tarihi: ${invoice.ocrData?.faturaTarihi || 'Bulunamadı'}`} 
        variant="outlined" 
      />
      <Chip 
        label={`Fatura Tipi: ${invoice.ocrData?.faturaTipi || 'Bulunamadı'}`} 
        variant="outlined" 
      />
      <Chip 
        label={`Tutar: ${invoice.ocrData?.tutar || 'Bulunamadı'}`} 
        variant="outlined" 
      />
      <Chip 
        label={`Kategori: ${invoice.ocrData?.kategori || 'Bulunamadı'}`} 
        variant="outlined" 
      />
    </Box>
  );

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleMenuClick = (view) => {
    setActiveView(view);
    setDrawerOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ my: 4, mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Fatura Yükleme Sistemi
            </Typography>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={authTab} onChange={handleAuthTabChange} centered>
                <Tab label="Giriş Yap" />
                <Tab label="Kayıt Ol" />
              </Tabs>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            {authTab === 0 ? (
              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={authData.email}
                  onChange={handleAuthInputChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Şifre"
                  name="password"
                  type="password"
                  value={authData.password}
                  onChange={handleAuthInputChange}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Giriş Yap
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Kullanıcı Adı"
                  name="username"
                  value={authData.username}
                  onChange={handleAuthInputChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={authData.email}
                  onChange={handleAuthInputChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Şifre"
                  name="password"
                  type="password"
                  value={authData.password}
                  onChange={handleAuthInputChange}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                >
                  Kayıt Ol
                </Button>
              </form>
            )}
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Fatura Yükleme Sistemi
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>Hoş geldin, {username}</Typography>
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            <ListItem button onClick={() => handleMenuClick('invoices')}>
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="Faturalarım" />
            </ListItem>
            <ListItem button onClick={() => handleMenuClick('upload')}>
              <ListItemIcon>
                <UploadFileIcon />
              </ListItemIcon>
              <ListItemText primary="Fatura Yükle" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {activeView === 'upload' && (
          <Box sx={{ mt: 4, mb: 2 }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                sx={{ mb: 2 }}
              >
                Dosya Seç
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
              </Button>

              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography>
                    Seçilen dosya: {selectedFile.name}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Yükle'}
                  </Button>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </Paper>
          </Box>
        )}

        {activeView === 'invoices' && (
          <Box>
            {latestInvoice && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Son Yüklenen Fatura
                </Typography>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {latestInvoice.originalName}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Yükleme Tarihi: {new Date(latestInvoice.uploadDate).toLocaleString()}
                    </Typography>
                    {latestInvoice.ocrData && renderInvoiceDetails(latestInvoice)}
                  </CardContent>
                </Card>
              </Box>
            )}

            <Box sx={{ mt: 4 }}>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <Typography variant="h5" component="h2">
                    Yüklenen Faturalar
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    {invoices.map((invoice) => (
                      <Grid item xs={12} key={invoice._id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {invoice.originalName}
                            </Typography>
                            <Typography color="textSecondary" gutterBottom>
                              Yükleme Tarihi: {new Date(invoice.uploadDate).toLocaleString()}
                            </Typography>
                            {invoice.ocrData && renderInvoiceDetails(invoice)}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                    {invoices.length === 0 && (
                      <Grid item xs={12}>
                        <Typography color="textSecondary">
                          Henüz başka fatura yüklenmemiş.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default App; 