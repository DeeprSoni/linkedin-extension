/**
 * Network Interception Script for LinkedIn Messaging
 *
 * This script intercepts LinkedIn's API calls when messages are sent.
 * Works regardless of UI context (profile, messaging, search, etc.)
 *
 * Approach: Inject into page context and wrap fetch/XMLHttpRequest
 */

export function injectNetworkInterceptor() {
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log('[Network Interceptor] Initializing...');

      // Store original functions
      const originalFetch = window.fetch;
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;

      // Helper to extract profile URL from different API response formats
      function extractProfileInfo(url, requestBody, responseData) {
        try {
          let profileUrn = null;
          let recipientId = null;
          let messageText = null;

          // Parse request body if it exists
          if (requestBody) {
            const body = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;

            // LinkedIn messaging API includes recipient info in various formats
            if (body.recipients) {
              recipientId = body.recipients[0];
            }
            if (body.recipientUrns) {
              recipientId = body.recipientUrns[0];
            }
            if (body.keyVersion && body.keyVersion.string) {
              // Conversation ID format
              recipientId = body.keyVersion.string;
            }

            // Extract message text
            if (body.message) {
              messageText = body.message;
            }
            if (body.eventCreate && body.eventCreate.value) {
              const eventData = body.eventCreate.value;
              if (eventData.attributedBody) {
                messageText = eventData.attributedBody.text;
              }
            }
          }

          // Try to get profile from current page context
          const currentUrl = window.location.href;
          let profileUrl = null;

          // If on a profile page
          if (currentUrl.includes('/in/')) {
            const match = currentUrl.match(/\\/in\\/([^\\/\\?]+)/);
            if (match) {
              profileUrl = 'https://www.linkedin.com/in/' + match[1];
            }
          }

          // If response contains profile data
          if (responseData) {
            const respData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

            // Look for profile URN in response
            if (respData.included) {
              for (const item of respData.included) {
                if (item.entityUrn && item.entityUrn.includes('fsd_profile')) {
                  const urnMatch = item.entityUrn.match(/fsd_profile:([^,)]+)/);
                  if (urnMatch && item.publicIdentifier) {
                    profileUrl = 'https://www.linkedin.com/in/' + item.publicIdentifier;
                    break;
                  }
                }
              }
            }
          }

          return {
            profileUrl,
            recipientId,
            messageText,
            timestamp: Date.now()
          };
        } catch (error) {
          console.error('[Network Interceptor] Error extracting profile info:', error);
          return null;
        }
      }

      // Wrap fetch
      window.fetch = async function(...args) {
        const [url, options] = args;
        const urlString = typeof url === 'string' ? url : url.toString();

        // Check if this is a messaging API call
        const isMessagingAPI =
          urlString.includes('/messaging/') ||
          urlString.includes('/voyagerMessagingDashMessengerMessages') ||
          urlString.includes('/voyager/api/messaging') ||
          urlString.includes('action=send');

        if (isMessagingAPI && options && options.method === 'POST') {
          console.log('[Network Interceptor] Detected message send API call:', urlString);

          try {
            // Call original fetch
            const response = await originalFetch.apply(this, args);

            // Clone response so we can read it
            const clonedResponse = response.clone();

            // Extract request body
            let requestBody = null;
            if (options.body) {
              requestBody = options.body;
            }

            // Read response
            const responseData = await clonedResponse.text();

            // Extract profile info
            const profileInfo = extractProfileInfo(urlString, requestBody, responseData);

            if (profileInfo && profileInfo.messageText) {
              console.log('[Network Interceptor] Message detected:', {
                profileUrl: profileInfo.profileUrl,
                messagePreview: profileInfo.messageText.substring(0, 50)
              });

              // Send to content script
              window.postMessage({
                type: 'LINKEDIN_MESSAGE_SENT',
                data: profileInfo
              }, '*');
            }

            return response;
          } catch (error) {
            console.error('[Network Interceptor] Error processing fetch:', error);
            return originalFetch.apply(this, args);
          }
        }

        // Not a messaging call, proceed normally
        return originalFetch.apply(this, args);
      };

      // Wrap XMLHttpRequest
      const xhrRequests = new WeakMap();

      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        const urlString = url.toString();
        const isMessagingAPI =
          urlString.includes('/messaging/') ||
          urlString.includes('/voyagerMessagingDashMessengerMessages') ||
          urlString.includes('/voyager/api/messaging');

        if (isMessagingAPI && method.toUpperCase() === 'POST') {
          xhrRequests.set(this, { url: urlString, method });
        }

        return originalXHROpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.send = function(body) {
        const requestInfo = xhrRequests.get(this);

        if (requestInfo) {
          console.log('[Network Interceptor] XHR message send detected:', requestInfo.url);

          // Listen for response
          this.addEventListener('load', function() {
            try {
              const responseData = this.responseText;
              const profileInfo = extractProfileInfo(requestInfo.url, body, responseData);

              if (profileInfo && profileInfo.messageText) {
                console.log('[Network Interceptor] XHR Message detected:', {
                  profileUrl: profileInfo.profileUrl,
                  messagePreview: profileInfo.messageText.substring(0, 50)
                });

                window.postMessage({
                  type: 'LINKEDIN_MESSAGE_SENT',
                  data: profileInfo
                }, '*');
              }
            } catch (error) {
              console.error('[Network Interceptor] Error processing XHR response:', error);
            }
          });
        }

        return originalXHRSend.call(this, body);
      };

      console.log('[Network Interceptor] ✅ Initialized successfully');
    })();
  `;

  // Inject at document_start to catch everything
  (document.head || document.documentElement).appendChild(script);
  script.remove(); // Clean up

  console.log('[Content Script] Network interceptor injected');
}
