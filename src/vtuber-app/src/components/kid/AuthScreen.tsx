import { useState, useEffect } from "react";
import { Box, Flex, Text, Heading, Input, VStack, HStack, Link } from "@chakra-ui/react";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { toaster } from "../ui/toaster";
import { motion, AnimatePresence } from "framer-motion";

const momoMascot = "./images/momo_mascot.png";

const MotionBox = motion(Box);
// const MotionFlex = motion(Flex);

interface AuthScreenProps {
  onLoginSuccess: (email: string) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps): React.JSX.Element {
  const [isLogin, setIsLogin] = useState(true);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // In-memory mock demo user store (no localStorage credential storage)
  const [inMemoryUsers, setInMemoryUsers] = useState([
    { email: "momo@edu.com", password: "password123", username: "Momo Fan" }
  ]);

  // Clean up any legacy plaintext keys from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem("kid_app_users");
      localStorage.removeItem("kid_app_current_user");
      localStorage.removeItem("kid_active_profile");
    } catch {
      // ignore
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toaster.create({
        title: "Vui lòng nhập đầy đủ thông tin!",
        type: "error",
        duration: 2000,
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (isLogin) {
        // Login Logic
        const foundUser = inMemoryUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (foundUser) {
          toaster.create({
            title: `Đăng nhập thành công! Chào ${foundUser.username || foundUser.email}`,
            type: "success",
            duration: 2000,
          });
          onLoginSuccess(foundUser.email);
        } else {
          toaster.create({
            title: "Email hoặc mật khẩu không đúng!",
            type: "error",
            duration: 2500,
          });
        }
      } else {
        // Register Logic
        if (!username) {
          toaster.create({
            title: "Vui lòng nhập tên người dùng!",
            type: "error",
            duration: 2000,
          });
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toaster.create({
            title: "Mật khẩu xác nhận không khớp!",
            type: "error",
            duration: 2000,
          });
          setLoading(false);
          return;
        }

        const userExists = inMemoryUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
          toaster.create({
            title: "Email này đã được đăng ký!",
            type: "error",
            duration: 2000,
          });
        } else {
          const newUser = { email, password, username };
          setInMemoryUsers((prev) => [...prev, newUser]);
          toaster.create({
            title: "Đăng ký thành công!",
            type: "success",
            duration: 2000,
          });
          onLoginSuccess(email);
        }
      }
      setLoading(false);
    }, 1200); // Simulated network delay
  };

  const handleSocialClick = (platform: string) => {
    toaster.create({
      title: `Đăng nhập qua ${platform} đang được xử lý`,
      description: "Tính năng này hiện là mô phỏng thẩm mỹ.",
      type: "info",
      duration: 2500,
    });
  };

  return (
    <Flex width="100vw" height="100vh" bg="#FFFFFF" overflow="hidden">
      
      {/* Left Column: Authentic minimalist form */}
      <Flex
        width={{ base: "100%", md: "50%" }}
        height="100%"
        flexDirection="column"
        justifyContent="space-between"
        p={{ base: 6, md: 12 }}
        position="relative"
      >
        {/* Top bar branding & sign-in indicator */}
        <Flex width="100%" alignItems="center" justifyContent="space-between">
          <HStack spaceX={2} alignItems="center">
            <Box
              width="32px"
              height="32px"
              borderRadius="lg"
              bg="#0EA5E9"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="sm"
            >
              <span style={{ fontSize: "16px", color: "white", fontWeight: "bold" }}>❄️</span>
            </Box>
            <Text fontSize="md" fontWeight="bold" color="#0F172A" letterSpacing="-0.02em">
              snow
            </Text>
          </HStack>

          <HStack
            px={3.5}
            py={1.5}
            border="1.5px solid"
            borderColor="#F1F5F9"
            borderRadius="full"
            fontSize="11px"
            color="#475569"
            fontWeight="bold"
            bg="#F8FAFC"
            spaceX={1.5}
          >
            <Text>You are signing into</Text>
            <HStack spaceX={0.5} color="#0E7490">
              <img src={momoMascot} alt="" style={{ width: "12px", height: "auto" }} />
              <Text fontWeight="extrabold">Grok</Text>
            </HStack>
          </HStack>
        </Flex>

        {/* Center content wrapper */}
        <Flex flexGrow={1} flexDirection="column" justifyContent="center" alignItems="center" width="100%">
          <MotionBox
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            width="100%"
            maxW="360px"
          >
            <AnimatePresence mode="wait">
              {!showCredentialsForm ? (
                // Social buttons layout (like mockup)
                <MotionBox
                  key="social-options"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Heading size="3xl" color="#0F172A" fontWeight="semibold" mb={8} textAlign="center" letterSpacing="-0.03em">
                    {isLogin ? "Log into your account" : "Create your account"}
                  </Heading>

                  <VStack spaceY={3.5} width="100%" mb={6}>
                    {/* Primary Button */}
                    <Button
                      onClick={() => setShowCredentialsForm(true)}
                      width="100%"
                      h="46px"
                      bg="#000000"
                      color="#FFFFFF"
                      borderRadius="full"
                      fontWeight="bold"
                      fontSize="sm"
                      _hover={{ bg: "#27272A" }}
                      _active={{ bg: "#3F3F46" }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Login with email
                    </Button>

                    <Button
                      onClick={() => handleSocialClick("Google")}
                      width="100%"
                      h="46px"
                      bg="#FFFFFF"
                      color="#0F172A"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      borderRadius="full"
                      fontWeight="semibold"
                      fontSize="sm"
                      _hover={{ bg: "#F8FAFC", borderColor: "#CBD5E1" }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" style={{ marginRight: '8px' }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Login with Google
                    </Button>

                    <Button
                      onClick={() => handleSocialClick("Apple")}
                      width="100%"
                      h="46px"
                      bg="#FFFFFF"
                      color="#0F172A"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      borderRadius="full"
                      fontWeight="semibold"
                      fontSize="sm"
                      _hover={{ bg: "#F8FAFC", borderColor: "#CBD5E1" }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style={{ marginRight: '8px' }}>
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.1.67-2.82 1.5-.63.72-1.18 1.87-1.03 2.99 1.1.09 2.15-.55 2.86-1.43z"/>
                      </svg>
                      Login with Apple
                    </Button>
                  </VStack>

                  <HStack justifyContent="center" fontSize="xs">
                    <Text color="#64748B">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                    </Text>
                    <Link
                      color="#0F172A"
                      fontWeight="bold"
                      onClick={() => setIsLogin(!isLogin)}
                      style={{ cursor: "pointer", textDecoration: "underline" }}
                    >
                      {isLogin ? "Sign up" : "Log in"}
                    </Link>
                  </HStack>
                </MotionBox>
              ) : (
                // Credentials form layout
                <MotionBox
                  key="credentials-form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  as="form"
                  onSubmit={handleAuth}
                >
                  <HStack
                    spaceX={2.5}
                    mb={6}
                    cursor="pointer"
                    onClick={() => setShowCredentialsForm(false)}
                    color="#64748B"
                    _hover={{ color: "#0F172A" }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="19" y1="12" x2="5" y2="12"/>
                      <polyline points="12,19 5,12 12,5"/>
                    </svg>
                    <Text fontSize="xs" fontWeight="bold">Back to login options</Text>
                  </HStack>

                  <Heading size="3xl" color="#0F172A" fontWeight="semibold" mb={6} letterSpacing="-0.03em">
                    {isLogin ? "Sign in with email" : "Create account"}
                  </Heading>

                  <VStack spaceY={4} width="100%">
                    {!isLogin && (
                      <Field label="Parent Name">
                        <Input
                          placeholder="Your name"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          size="md"
                          borderRadius="xl"
                          borderColor="#CBD5E1"
                          _focus={{ borderColor: "#0EA5E9", boxShadow: "0 0 0 1px #0EA5E9" }}
                        />
                      </Field>
                    )}

                    <Field label="Email address">
                      <Input
                        type="email"
                        placeholder="parent@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        size="md"
                        borderRadius="xl"
                        borderColor="#CBD5E1"
                        _focus={{ borderColor: "#0EA5E9", boxShadow: "0 0 0 1px #0EA5E9" }}
                      />
                    </Field>

                    <Field label="Password">
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="md"
                        borderRadius="xl"
                        borderColor="#CBD5E1"
                        _focus={{ borderColor: "#0EA5E9", boxShadow: "0 0 0 1px #0EA5E9" }}
                      />
                    </Field>

                    {!isLogin && (
                      <Field label="Confirm Password">
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          size="md"
                          borderRadius="xl"
                          borderColor="#CBD5E1"
                          _focus={{ borderColor: "#0EA5E9", boxShadow: "0 0 0 1px #0EA5E9" }}
                        />
                      </Field>
                    )}
                  </VStack>

                  {/* Quick Credential Tip for Demo */}
                  {isLogin && (
                    <Box mt={4} p={3.5} bg="#EFF6FF" borderRadius="xl" border="1.5px solid" borderColor="#BFDBFE" width="100%">
                      <Text fontSize="11px" color="#1E40AF" fontWeight="bold">
                        💡 Tài khoản demo: momo@edu.com / password123
                      </Text>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    width="100%"
                    mt={6}
                    borderRadius="full"
                    bg="#000000"
                    color="#FFFFFF"
                    fontWeight="bold"
                    fontSize="sm"
                    loading={loading}
                    loadingText={isLogin ? "Signing in..." : "Creating..."}
                    _hover={{ bg: "#27272A" }}
                    _active={{ bg: "#3F3F46" }}
                  >
                    {isLogin ? "Sign In" : "Register"}
                  </Button>
                </MotionBox>
              )}
            </AnimatePresence>
          </MotionBox>
        </Flex>

        {/* Bottom footer text */}
        <Box width="100%" textAlign="center" pt={4}>
          <Text fontSize="10px" color="#94A3B8" maxW="360px" mx="auto" lineHeight="relaxed">
            By continuing, you agree to xAI's <Link href="#terms" textDecoration="underline" fontWeight="medium">Terms of Service</Link> and <Link href="#privacy" textDecoration="underline" fontWeight="medium">Privacy Policy</Link>.
          </Text>
        </Box>
      </Flex>

      {/* Right Column: Premium Dark Grok Spotlight Layout */}
      <Flex
        display={{ base: "none", md: "flex" }}
        width={{ base: "none", md: "50%" }}
        height="100%"
        bg="#000000"
        position="relative"
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        {/* Soft Ambient Cyan-Blue Spotlight Glow from Top-Right */}
        <Box
          position="absolute"
          top="-15%"
          right="-15%"
          width="70%"
          height="70%"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)"
          filter="blur(60px)"
          pointerEvents="none"
        />

        {/* Soft Bottom-Left Glow */}
        <Box
          position="absolute"
          bottom="-10%"
          left="-10%"
          width="50%"
          height="50%"
          borderRadius="full"
          bg="radial-gradient(circle, rgba(15, 23, 42, 0.4) 0%, transparent 70%)"
          filter="blur(40px)"
          pointerEvents="none"
        />

        {/* Huge Glossy xAI-styled debossed outline vector of Momo Mascot/AgentKid Emblem */}
        <Box position="relative" zIndex={1} width="100%" height="100%" display="flex" alignItems="center" justifyContent="center">
          {/* Subtle debossed backdrop circle */}
          <Box
            position="absolute"
            width="550px"
            height="550px"
            borderRadius="full"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.03)"
            bg="radial-gradient(circle, rgba(255, 255, 255, 0.01) 0%, transparent 80%)"
          />

          {/* Centered large artistic mascot rendering */}
          <VStack spaceY={6} zIndex={2}>
            <MotionBox
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              position="relative"
            >
              {/* Soft mascot spotlight backplate glow */}
              <Box
                position="absolute"
                inset="-20px"
                bg="radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)"
                borderRadius="full"
                filter="blur(20px)"
              />
              
              <img
                src={momoMascot}
                alt="Momo Mascot"
                style={{
                  width: "280px",
                  height: "auto",
                  filter: "drop-shadow(0 25px 40px rgba(0, 0, 0, 0.6)) grayscale(0.2) contrast(1.1)",
                  opacity: 0.85,
                }}
              />
            </MotionBox>
            
            <VStack spaceY={1} textAlign="center">
              <Heading size="lg" color="#F8FAFC" fontWeight="bold" letterSpacing="wide" style={{ opacity: 0.9 }}>
                Momo Companion
              </Heading>
              <Text fontSize="xs" color="#64748B" letterSpacing="widest" textTransform="uppercase">
                Emotional Intelligence Playground
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Flex>

    </Flex>
  );
}
