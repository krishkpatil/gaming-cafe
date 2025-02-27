import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  VStack,
  useToast,
  FormErrorMessage,
  Select
} from '@chakra-ui/react';
import { createUser } from '../services/userService';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const initialState = {
    username: '',
    password: '',
    confirmPassword: '',
    isAdmin: false, // Default to regular user when creating from admin panel
    gender: 'male' // Default gender
  };
  
  const [formData, setFormData] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      
      const result = await createUser({
        username: userData.username,
        password: userData.password,
        is_admin: userData.isAdmin,
        gender: userData.gender
      });
      
      toast({
        title: 'User created',
        description: `${formData.username} has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form state
      setFormData(initialState);
      
      // Close modal
      onClose();
      
      // Check the structure of the response and extract the user object
      // Based on your API, this could be result.user, result or another structure
      const newUser = result.user || result;
      
      // Notify parent component to update the list
      if (onUserCreated && newUser) {
        onUserCreated(newUser);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New User</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.username}>
              <FormLabel>Username</FormLabel>
              <Input
                name="username"
                placeholder="Enter username"
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
                placeholder="Enter password"
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
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
            </FormControl>
            
            <FormControl>
              <FormLabel>Gender</FormLabel>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <Checkbox
                name="isAdmin"
                isChecked={formData.isAdmin}
                onChange={handleChange}
              >
                Admin User
              </Checkbox>
            </FormControl>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Creating..."
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateUserModal;