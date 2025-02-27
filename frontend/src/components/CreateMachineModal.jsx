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
  VStack,
  useToast,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { createMachine } from '../services/machineService';

const CreateMachineModal = ({ isOpen, onClose, onMachineCreated }) => {
  const initialState = {
    name: '',
    machine_type: '',
    hourly_rate: 5.00 // Default value
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

  const handleRateChange = (value) => {
    setFormData({
      ...formData,
      hourly_rate: parseFloat(value) || 0
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Machine name is required';
    }
    
    if (!formData.machine_type) {
      errors.machine_type = 'Machine type is required';
    }
    
    if (!formData.hourly_rate || formData.hourly_rate <= 0) {
      errors.hourly_rate = 'Hourly rate must be greater than 0';
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
      const result = await createMachine(formData);
      
      toast({
        title: 'Machine created',
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
      if (onMachineCreated) {
        onMachineCreated(result.machine);
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
        <ModalHeader>Create New Machine</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={formErrors.name}>
              <FormLabel>Machine Name</FormLabel>
              <Input
                name="name"
                placeholder="Enter machine name"
                value={formData.name}
                onChange={handleChange}
              />
              <FormErrorMessage>{formErrors.name}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={formErrors.machine_type}>
              <FormLabel>Machine Type</FormLabel>
              <Select
                name="machine_type"
                placeholder="Select machine type"
                value={formData.machine_type}
                onChange={handleChange}
              >
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="VIP">VIP</option>
              </Select>
              <FormErrorMessage>{formErrors.machine_type}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={formErrors.hourly_rate}>
              <FormLabel>Hourly Rate</FormLabel>
              <InputGroup>
                <InputRightElement
                  pointerEvents="none"
                  children="$/hr"
                />
                <NumberInput
                  min={0.01}
                  precision={2}
                  step={0.5}
                  value={formData.hourly_rate}
                  onChange={handleRateChange}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </InputGroup>
              <FormErrorMessage>{formErrors.hourly_rate}</FormErrorMessage>
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

export default CreateMachineModal;