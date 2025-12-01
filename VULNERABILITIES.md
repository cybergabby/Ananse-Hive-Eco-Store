# Anase Eco Store - Security Training Lab

## ⚠️ EDUCATIONAL PURPOSE ONLY

This e-commerce application is intentionally vulnerable for security training and Capture The Flag (CTF) exercises. **DO NOT deploy this to production.**

## 🔒 Embedded Vulnerabilities

### 1. **SQL Injection Opportunities**
- **Location**: Authentication flows
- **Details**: No input validation or parameterization in auth forms
- **Impact**: Potential database access bypass

### 2. **Insecure Direct Object Reference (IDOR)**
- **Location**: 
  - `/account?userId=<UUID>` - View any user's profile
  - `/orders?orderId=<UUID>` - View any user's orders
  - Profile balance information exposed
- **Details**: URL parameters allow accessing other users' data without authorization
- **Impact**: Unauthorized data access, information disclosure

### 3. **Reflected XSS (Cross-Site Scripting)**
- **Location**: `/store` - Search functionality
- **Details**: Search query rendered with `dangerouslySetInnerHTML` without sanitization
- **Exploit**: Try searching for `<img src=x onerror=alert('XSS')>`
- **Impact**: Session hijacking, credential theft

### 4. **Stored XSS (Cross-Site Scripting)**
- **Location**: Product reviews on `/product/:id`
- **Details**: Review comments stored and rendered without sanitization
- **Exploit**: Submit review with `<script>alert('Stored XSS')</script>`
- **Impact**: Persistent attacks affecting all users viewing the product

### 5. **Broken Access Control**
- **Location**: RLS policies
- **Details**: 
  - Users can view ALL profiles (not just their own)
  - Users can view ALL orders (not just their own)
  - Discount codes table publicly accessible
- **Impact**: Information disclosure, unauthorized access

### 6. **Parameter Tampering**
- **Location**: Checkout page (`/checkout`)
- **Details**: 
  - Discount calculation done client-side
  - Total price calculated on client and accepted by server
  - Cart quantities can be set to negative numbers
- **Exploit**: Modify discount_percent or total price in checkout request
- **Impact**: Financial loss, inventory manipulation

### 7. **Discount Code Abuse**
- **Location**: Checkout flow
- **Details**: All discount codes visible in database including "ADMIN100" (100% off)
- **Impact**: Revenue loss through unauthorized discounts

### 8. **Missing Rate Limiting**
- **Location**: Login endpoint, profile updates
- **Details**: No protection against brute force or automated attacks
- **Impact**: Account takeover, DoS potential

### 9. **Information Disclosure**
- **Location**: Multiple areas
- **Details**:
  - User IDs exposed in URLs and UI
  - Order IDs displayed with instructions on IDOR
  - Detailed error messages leak system information
  - Console logs contain sensitive data
- **Impact**: Reconnaissance for further attacks

### 10. **Weak Authentication**
- **Location**: Auth page
- **Details**:
  - No password complexity requirements
  - No email verification (auto-confirm enabled)
  - Username not sanitized (XSS in stored username)
- **Impact**: Easy account compromise

### 11. **Race Conditions**
- **Location**: Checkout balance update
- **Details**: Balance update not atomic, multiple concurrent checkouts possible
- **Impact**: Double-spending, balance manipulation

### 12. **Client-Side Security Controls**
- **Location**: Throughout application
- **Details**:
  - Discount validation on client-side
  - Price calculations in browser
  - Cart data in localStorage (easily manipulated)
- **Impact**: Business logic bypass

## 🎯 Training Objectives

Students should learn to:
1. Identify and exploit IDOR vulnerabilities
2. Perform XSS attacks (both reflected and stored)
3. Understand client-side vs server-side validation
4. Recognize broken access control
5. Exploit parameter tampering in e-commerce flows
6. Understand the importance of RLS policies
7. Practice information gathering from exposed data

## 🛡️ Fixes (DO NOT IMPLEMENT - For Discussion Only)

### For SQL Injection:
- Use parameterized queries (Supabase does this automatically)
- Add input validation with libraries like Zod

### For IDOR:
- Update RLS policies to check `auth.uid() = user_id`
- Remove userId/orderId URL parameters
- Implement proper authorization checks

### For XSS:
- Use `textContent` instead of `dangerouslySetInnerHTML`
- Sanitize inputs with DOMPurify
- Implement Content Security Policy headers

### For Access Control:
- Fix RLS policies to be user-specific
- Implement proper authorization middleware
- Remove public access to sensitive tables

### For Parameter Tampering:
- Move all calculations to server-side
- Validate all prices/discounts server-side
- Use signed tokens for cart data

### For Rate Limiting:
- Implement rate limiting on authentication
- Add CAPTCHA for signup/login
- Monitor for suspicious patterns

## 📚 Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html

---

**Remember**: This is for EDUCATIONAL PURPOSES ONLY. Understanding vulnerabilities helps build secure applications.