import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Container,
  useToast
} from '@chakra-ui/react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(username, password);
      toast({
        title: 'Success',
        description: 'You have been logged in successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error(err);
      // The error is already handled in the AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" centerContent py={10}>
      <Box p={8} width="100%" borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="flex-start">
          <Heading>Login</Heading>
          
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4} align="flex-start" width="100%">
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              
              <Button
                colorScheme="blue"
                width="full"
                type="submit"
                isLoading={isSubmitting}
                loadingText="Logging in..."
              >
                Login
              </Button>
            </VStack>
          </form>
          
          <Text alignSelf="center">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'blue' }}>
              Sign Up
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;