// import { BrowserWindow, shell, ipcMain } from 'electron';
// import { ipcMainHandle, isNetworkError } from '../util.js';
// import Store from 'electron-store';
// import axios from 'axios';
// import * as http from 'http';
// import * as url from 'url';
// import { Server } from 'http';

// const API_BASE_URL = process.env.MAIN_API_BASE_URL || 'http://localhost:8001';

// // Create axios instance
// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 10000, // Add a timeout
// });

// const setAuthToken = (token: string) => {
//   if (token) {
//     apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   } else {
//     delete apiClient.defaults.headers.common['Authorization'];
//   }
// };

// const OAUTH_LOCAL_PORT = 34567; // Pick an unused port
// const OAUTH_REDIRECT_URI = `http://localhost:${OAUTH_LOCAL_PORT}/auth/oauth-electron-callback`;
// const OAUTH_TIMEOUT_MS = 35000; // 35 seconds

// function startOAuthServer(provider: 'google' | 'microsoft' | 'github', mainWindow: BrowserWindow, store: Store<StoreSchema>) {
//   // Keep a reference to the server to prevent GC and port conflicts
//   if ((global as any)._activeOAuthServer) {
//     try { ((global as any)._activeOAuthServer as http.Server).close(); } catch {}
//     (global as any)._activeOAuthServer = null;
//   }
//   return new Promise<{ success: boolean; token?: string; user?: any; message?: string }>((resolve) => {
//     let server: Server | null = null; // Define server variable here
//     let timeoutId: NodeJS.Timeout | null = null; // Variable to hold the timeout ID

//     const cleanup = (data: { success: boolean; token?: string; user?: any; message?: string }) => {
//       if (timeoutId) {
//         clearTimeout(timeoutId); // Clear timeout if it exists
//         timeoutId = null;
//       }
//       if (server) {
//         try { server.close(); } catch {}
//         server = null;
//         (global as any)._activeOAuthServer = null;
//       }
//       resolve(data);
//     };

//     server = http.createServer(async (req, res) => {
//       // Clear the timeout as soon as we receive any request on the callback path
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//         timeoutId = null;
//       }

//       const parsedUrl = url.parse(req.url || '', true);
//       if (process.env.NODE_ENV !== 'production') {
//         console.log(`[OAuth] Received request on local server: ${req.url}`);
//       }

//       if (parsedUrl.pathname === '/auth/oauth-electron-callback') {
//         const code = parsedUrl.query.code as string;
//         const error = parsedUrl.query.error as string;
        
//         let pugCallbackQuery = ''; // Query string for the pug template
//         let resolveData: { success: boolean; token?: string; user?: any; message?: string } = { success: false, message: 'Unknown state' };

//         // Determine the backend URL components from API_BASE_URL
//         const backendUrlParts = new URL(API_BASE_URL);
//         const backendBaseForPug = `${backendUrlParts.protocol}//${backendUrlParts.host}`;

//         if (code) {
//           if (process.env.NODE_ENV !== 'production') {
//             console.log(`[OAuth] Received code: ${code.substring(0, 20)}...`);
//             console.log(`[OAuth] Exchanging code with backend for provider: ${provider}`);
//           }
//           try {
//             const response = await apiClient.post(`/auth/${provider}/callback`, {
//               code,
//               redirect_uri: OAUTH_REDIRECT_URI,
//             });
//             if (process.env.NODE_ENV !== 'production') {
//               console.log('[OAuth] Backend response received:', response.data);
//             }

//             if (response.data?.success === true && response.data?.token) {
//               if (process.env.NODE_ENV !== 'production') {
//                 console.log('[OAuth] Token received from backend. Saving and resolving promise.');
//               }
//               store.set('authToken', response.data.token);
//               store.set('user', response.data.user); // Save user
//               const codemateUrl = `codemate://auth/callback?code=${encodeURIComponent(code)}`;
//               pugCallbackQuery = `code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(codemateUrl)}`;
//               resolveData = { success: true, ...response.data };
//             } else {
//               if (process.env.NODE_ENV !== 'production') {
//                 console.error('[OAuth] Backend indicated failure. Redirecting with error message.');
//               }
//               const msg = response.data?.message || 'Authentication failed on backend.';
//               pugCallbackQuery = `message=${encodeURIComponent(msg)}`;
//               resolveData = { success: false, message: msg };
//             }
//           } catch (err: any) {
//             if (process.env.NODE_ENV !== 'production') {
//               console.error('[OAuth] Error during code exchange:', err.response?.data || err.message);
//             }
//             const msg = err?.response?.data?.message || err.message || 'OAuth callback failed during code exchange.';
//             pugCallbackQuery = `message=${encodeURIComponent(msg)}`;
//             resolveData = { success: false, message: msg };
//           }
//         } else if (error) {
//           if (process.env.NODE_ENV !== 'production') {
//             console.error(`[OAuth] Received error in callback: ${error}`);
//           }
//           pugCallbackQuery = `error=${encodeURIComponent(error)}`;
//           resolveData = { success: false, message: error };
//         } else {
//           if (process.env.NODE_ENV !== 'production') {
//             console.error('[OAuth] No code or error found in callback URL.');
//           }
//           res.writeHead(200, { 'Content-Type': 'text/html' });
//           res.end('<html><body><h2>Authentication Error</h2><p>No authorization code or error was received from the provider.</p></body></html>');
//           cleanup({ success: false, message: 'No code or error in callback' }); // Use cleanup
//           return; // Exit early
//         }

//         // Construct the full pugCallbackUrl using the backend's actual host and port
//         const pugCallbackUrl = `${backendBaseForPug}/auth/callback?${pugCallbackQuery}`;
        
//         if (process.env.NODE_ENV !== 'production') {
//           console.log(`[OAuth] Redirecting browser to Pug template at: ${pugCallbackUrl}`);
//         }
//         res.writeHead(302, { Location: pugCallbackUrl });
//         res.end();

//         cleanup(resolveData); // Use cleanup

//       } else {
//         if (process.env.NODE_ENV !== 'production') {
//           console.warn(`[OAuth] Received unexpected request path: ${parsedUrl.pathname}`);
//         }
//         res.writeHead(404);
//         res.end();
//       }
//     });

//     server.listen(OAUTH_LOCAL_PORT, '127.0.0.1', () => {
//       if (process.env.NODE_ENV !== 'production') {
//         console.log(`[OAuth] Listening for callback on ${OAUTH_REDIRECT_URI}`);
//       }
//       timeoutId = setTimeout(() => {
//         const timeoutMessage = 'Authentication timed out. Please try again.';
//         // Construct the timeout redirect URL correctly as well
//         const backendUrlParts = new URL(API_BASE_URL);
//         const backendBaseForPug = `${backendUrlParts.protocol}//${backendUrlParts.host}`;
//         const timeoutPugUrl = `${backendBaseForPug}/auth/callback?message=${encodeURIComponent(timeoutMessage)}`;
        
//         cleanup({ success: false, message: timeoutMessage });
//       }, OAUTH_TIMEOUT_MS);
//     });

//     server.on('error', (err) => {
//       if (process.env.NODE_ENV !== 'production') {
//         console.error('[OAuth] Server error:', err);
//       }
//       cleanup({ success: false, message: `Server error: ${err.message}` });
//     });

//     (global as any)._activeOAuthServer = server;
//   });
// }

// export function setupAuthHandlers(mainWindow: BrowserWindow, store: Store<StoreSchema>) {
//   ipcMainHandle('signUp', async (userData: SignUpData) => {
//     try {
//       const response = await apiClient.post('/auth/signup', userData);
//       if (response.data.token && response.data.user) {
//         store.set('authToken', response.data.token);
//         store.set('user', response.data.user); // Save user
//       }
//       return { success: true, ...response.data };
//     } catch (error: any) {
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Registration failed',
//       };
//     }
//   });

//   ipcMainHandle('saveAuthToken', async (token: string) => {
//     try {
//       if (token) {
//         store.set('authToken', token);
//       } else {
//         store.delete('authToken');
//         store.delete('user');
//         store.delete('workflows');
//       }
//       return { success: true };
//     } catch (error) {
//       return { success: false, message: 'Failed to save authentication state' };
//     }
//   });

//   ipcMainHandle('checkEmail', async (data: { email: string }) => {
//     try {
//       const response = await apiClient.post('/auth/check-email', data);
//       return response.data;
//     } catch (error: any) {
//       if (isNetworkError(error)) {
//         return { success: false, message: 'Network error checking email.', potentialOffline: true };
//       }
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to check email',
//       };
//     }
//   });

//   ipcMainHandle('signIn', async (credentials: SignInData) => {
//     try {
//       const response = await apiClient.post('/auth/signin', credentials);
      
//       if (response.data?.token && response.data?.user) {
//         store.set('authToken', response.data.token);
//         store.set('user', response.data.user); // Save user
//       }
      
//       return { success: true, ...response.data };
//     } catch (error: any) {
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Login failed',
//       };
//     }
//   });

//   ipcMainHandle('verifyToken', async (token: string) => {
//     try {
//       if (!token) {
//         return { success: false, message: 'No token provided', potentialOffline: false };
//       }
//       setAuthToken(token); // Set token for the verification request
//       const response = await apiClient.post('/auth/verify', { token });
//       // Only treat as invalid if backend says so
//       if (response.data?.valid === false) {
//         mainWindow.webContents.send('tokenInvalid');
//         store.delete('authToken');
//         store.delete('user');
//         store.delete('workflows');
//         return { success: false, message: response.data?.message || 'Invalid token', potentialOffline: false };
//       }
//       if (response.data.user) {
//         store.set('user', response.data.user); // Update stored user
//       }
//       return { success: true, user: response.data.user };
//     } catch (error: any) {
//       // Distinguish between network error and invalid token
//       if (isNetworkError(error)) {
//         console.warn('Token verification failed due to network error. Using cached user data.');
//         const cachedUser = store.get('user'); // Retrieve cached user
//         return {
//           success: false,
//           message: 'Token verification failed due to network error. Assuming token is still valid for offline use.',
//           potentialOffline: true,
//           user: cachedUser // Include cached user data
//         };
//       }
//       // If backend responded with invalid token, treat as invalid
//       if (error.response && error.response.status === 401) {
//         mainWindow.webContents.send('tokenInvalid');
//         store.delete('authToken');
//         store.delete('user');
//         store.delete('workflows');
//         return { success: false, message: error.response?.data?.message || 'Invalid token', potentialOffline: false };
//       }
//       // Other errors
//       return { success: false, message: 'Token verification failed', potentialOffline: false };
//     }
//   });

//   async function handleOAuthSignInExternal(provider: 'google' | 'microsoft' | 'github') {
//     const loginUrl = `${API_BASE_URL}/auth/${provider}/login?redirect_uri=${encodeURIComponent(OAUTH_REDIRECT_URI)}`;
//     shell.openExternal(loginUrl);
//     const response = await startOAuthServer(provider, mainWindow, store);
//     if (response.success && response.token && response.user) {
//       store.set('authToken', response.token);
//       store.set('user', response.user); // Save user
//     }
//     return response;
//   }

//   ipcMain.handle('googleSignIn', async () => {
//     return await handleOAuthSignInExternal('google');
//   });
//   ipcMain.handle('microsoftSignIn', async () => {
//     return await handleOAuthSignInExternal('microsoft');
//   });
//   ipcMain.handle('githubSignIn', async () => { 
//     return await handleOAuthSignInExternal('github'); 
//   });

// }
