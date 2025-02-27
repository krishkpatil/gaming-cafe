import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FormErrorMessage,
  useToast,
  RadioGroup,
  Radio,
  Stack
} from '@chakra-ui/react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    gender: 'male', // Default to male
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, error } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGenderChange = (value) => {
    setFormData({
      ...formData,
      gender: value
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      
      await signup(userData);
      
      toast({
        title: 'Account created',
        description: 'You have been signed up successfully. Please login.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to login page is handled by the AuthContext
    } catch (err) {
      console.error(err);
      // Error is handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" centerContent py={10}>
      <Box p={8} width="100%" borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="flex-start">
          <Heading>Sign Up</Heading>
          
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4} align="flex-start" width="100%">
              <FormControl isRequired isInvalid={formErrors.username}>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
                <FormErrorMessage>{formErrors.username}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={formErrors.password}>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <FormErrorMessage>{formErrors.password}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={formErrors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
              </FormControl>
              
              <FormControl>
                <FormLabel>Gender</FormLabel>
                <RadioGroup onChange={handleGenderChange} value={formData.gender}>
                  <Stack direction="row">
                    <Radio value="male">Male</Radio>
                    <Radio value="female">Female</Radio>
                    <Radio value="other">Other</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              <Button
                colorScheme="blue"
                width="full"
                type="submit"
                isLoading={isSubmitting}
                loadingText="Signing up..."
              >
                Sign Up
              </Button>
            </VStack>
          </form>
          
          <Text alignSelf="center">
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'blue' }}>
              Login
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Signup;