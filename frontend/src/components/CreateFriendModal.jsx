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
  Select,
  Textarea,
  VStack,
  useToast,
  FormErrorMessage
} from '@chakra-ui/react';
import { createFriend } from '../services/friendService';

const CreateFriendModal = ({ isOpen, onClose, onFriendCreated }) => {
  const initialState = {
    name: '',
    role: '',
    description: '',
    gender: ''
  };
  
  const [formData, setFormData] = useState(initialState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Name is required';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    if (!formData.description) {
      errors.description = 'Description is required';
    }
    
    if (!formData.gender) {
      errors.gender = 'Gender is required';
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
      const result = await createFriend(formData);
      
      toast({
        title: 'Friend created',
        description: `${formData.name} has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form state
      setFormData(initialState);
      
      // Close modal
      onClose();
      
      // Notify parent component to update the list
      if (onFriendCreated) {
        onFriendCreated(result.friend);
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
        <ModalHeader>Create New Friend</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.name}>
              <FormLabel>Name</FormLabel>
              <Input
                name="name"
                placeholder="Enter friend's name"
                value={formData.name}
                onChange={handleChange}
              />
              <FormErrorMessage>{formErrors.name}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={formErrors.role}>
              <FormLabel>Role</FormLabel>
              <Input
                name="role"
                placeholder="Enter friend's role"
                value={formData.role}
                onChange={handleChange}
              />
              <FormErrorMessage>{formErrors.role}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={formErrors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                name="description"
                placeholder="Enter a description"
                value={formData.description}
                onChange={handleChange}
                resize="vertical"
              />
              <FormErrorMessage>{formErrors.description}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={formErrors.gender}>
              <FormLabel>Gender</FormLabel>
              <Select 
                name="gender"
                placeholder="Select gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <FormErrorMessage>{formErrors.gender}</FormErrorMessage>
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

export default CreateFriendModal;