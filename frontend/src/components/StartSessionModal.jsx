import React, { useState, useEffect } from 'react';
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
  Select,
  VStack,
  useToast,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Text,
  Box,
  Divider
} from '@chakra-ui/react';
import { getAllUsers } from '../services/userService';
import { getAllMachines } from '../services/machineService';
import { startSession } from '../services/sessionService';

const StartSessionModal = ({ isOpen, onClose, onSessionCreated }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    machine_id: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  
  const toast = useToast();

  // Fetch users and machines when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Fetch necessary data from API
  const fetchData = async () => {
    setLoadingData(true);
    try {
      // Fetch users
      const usersResponse = await getAllUsers();
      setUsers(usersResponse.users || []);
      
      // Fetch available machines
      const machinesResponse = await getAllMachines();
      // Filter for available machines only
      const availableMachines = (machinesResponse.machines || [])
        .filter(machine => machine.status === 'Available');
      setMachines(availableMachines);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load necessary data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Update selected entities
    if (name === 'user_id') {
      const user = users.find(u => u.id.toString() === value);
      setSelectedUser(user || null);
    } else if (name === 'machine_id') {
      const machine = machines.find(m => m.id.toString() === value);
      setSelectedMachine(machine || null);
    }
  };

  // Calculate how much time the user can afford
  const calculateAffordableTime = () => {
    if (!selectedUser || !selectedMachine) return 0;
    
    const balance = selectedUser.balance;
    const hourlyRate = selectedMachine.hourly_rate;
    
    if (hourlyRate <= 0) return 0;
    
    // Calculate hours (with 2 decimal precision)
    const hours = Math.floor((balance / hourlyRate) * 100) / 100;
    
    return hours;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.user_id) {
      errors.user_id = 'User selection is required';
    }
    
    if (!formData.machine_id) {
      errors.machine_id = 'Machine selection is required';
    }
    
    // Check if user has sufficient balance
    if (selectedUser && selectedMachine && selectedUser.balance <= 0) {
      errors.user_id = 'User has insufficient balance';
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
      const result = await startSession(formData);
      
      toast({
        title: 'Session started',
        description: 'The session has been started successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setFormData({
        user_id: '',
        machine_id: ''
      });
      setSelectedUser(null);
      setSelectedMachine(null);
      
      // Close modal
      onClose();
      
      // Notify parent component
      if (onSessionCreated) {
        onSessionCreated(result.session);
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

  // Format time in hours and minutes
  const formatTime = (hours) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Start New Session</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loadingData ? (
            <Text>Loading data...</Text>
          ) : (
            <VStack spacing={4} align="stretch">
              {machines.length === 0 && (
                <Alert status="warning">
                  <AlertIcon />
                  <Text>No available machines. Please add machines or set some to Available status.</Text>
                </Alert>
              )}
              
              <FormControl isRequired isInvalid={formErrors.user_id}>
                <FormLabel>Select User</FormLabel>
                <Select
                  name="user_id"
                  placeholder="Select a user"
                  value={formData.user_id}
                  onChange={handleChange}
                >
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username} - Balance: ${user.balance.toFixed(2)}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{formErrors.user_id}</FormErrorMessage>
              </FormControl>
              
              <FormControl isRequired isInvalid={formErrors.machine_id}>
                <FormLabel>Select Machine</FormLabel>
                <Select
                  name="machine_id"
                  placeholder="Select a machine"
                  value={formData.machine_id}
                  onChange={handleChange}
                  isDisabled={machines.length === 0}
                >
                  {machines.map(machine => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} - {machine.machine_type} - ${machine.hourly_rate.toFixed(2)}/hr
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{formErrors.machine_id}</FormErrorMessage>
              </FormControl>
              
              {selectedUser && selectedMachine && (
                <>
                  <Divider my={2} />
                  
                  <Box p={4} borderWidth="1px" borderRadius="md" bg="blue.50">
                    <Text fontWeight="bold" mb={2}>Session Summary</Text>
                    <Text>User: {selectedUser.username}</Text>
                    <Text>Current Balance: ${selectedUser.balance.toFixed(2)}</Text>
                    <Text>Machine: {selectedMachine.name} ({selectedMachine.machine_type})</Text>
                    <Text>Hourly Rate: ${selectedMachine.hourly_rate.toFixed(2)}/hr</Text>
                    <Text mt={2} fontWeight="bold">
                      Affordable Time: {formatTime(calculateAffordableTime())}
                    </Text>
                  </Box>
                  
                  {selectedUser.balance <= 0 && (
                    <Alert status="error">
                      <AlertIcon />
                      <Text>User has insufficient balance. Please add funds before starting a session.</Text>
                    </Alert>
                  )}
                </>
              )}
            </VStack>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Starting..."
            isDisabled={loadingData || machines.length === 0 || (selectedUser && selectedUser.balance <= 0)}
          >
            Start Session
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StartSessionModal;