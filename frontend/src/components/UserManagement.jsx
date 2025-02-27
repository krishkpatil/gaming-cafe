import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Text,
  useDisclosure,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  ButtonGroup,
  HStack,
  Avatar
} from '@chakra-ui/react';
import { AddIcon, EditIcon } from '@chakra-ui/icons';
import { getAllUsers, addUserBalance } from '../services/userService';
import CreateUserModal from './CreateUserModal';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(0);
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isBalanceOpen, onOpen: onBalanceOpen, onClose: onBalanceClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllUsers();
      setUsers(response.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user creation
  const handleUserCreated = (newUser) => {
    // Safely check if newUser has all required properties
    if (newUser && typeof newUser === 'object') {
      // Ensure balance is a number (default to 0 if not provided)
      const userWithDefaults = {
        ...newUser,
        balance: newUser.balance || 0
      };
      setUsers(prevUsers => [...prevUsers, userWithDefaults]);
      // Optionally refresh the full user list to ensure consistent data
      fetchUsers();
    } else {
      console.error("Received invalid user data:", newUser);
      // Fallback: refresh the user list to get the updated data
      fetchUsers();
    }
  };

  // Open balance modal for a user
  const openBalanceModal = (user) => {
    setSelectedUser(user);
    setBalance(0);
    onBalanceOpen();
  };

  // Handle adding balance
  const handleAddBalance = async () => {
    if (!selectedUser || balance <= 0) {
      toast({
        title: 'Invalid input',
        description: 'Please select a user and enter a valid amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await addUserBalance(selectedUser.id, {
        amount: balance
      });

      // Check if response has the expected structure
      if (response && response.user) {
        // Update user in the list
        setUsers(users.map(u => 
          u.id === response.user.id ? response.user : u
        ));
      } else {
        // Fallback: refresh the whole user list
        fetchUsers();
      }

      toast({
        title: 'Balance added',
        description: `Successfully added $${balance.toFixed(2)} to ${selectedUser.username}'s account`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onBalanceClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Quick balance buttons
  const quickBalanceOptions = [5, 10, 20, 50];

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header section */}
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">User Management</Heading>
        
        <Button 
          colorScheme="blue" 
          leftIcon={<AddIcon />} 
          onClick={onCreateOpen}
        >
          Create User
        </Button>
      </Flex>
      
      {/* Error message */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}
      
      {/* Loading state */}
      {loading ? (
        <Flex justifyContent="center" alignItems="center" minH="50vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      ) : (
        // Users table
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>User</Th>
                <Th>Role</Th>
                <Th isNumeric>Balance</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center">No users found</Td>
                </Tr>
              ) : (
                users.map(user => (
                  <Tr key={user.id}>
                    <Td>{user.id}</Td>
                    <Td>
                      <Flex alignItems="center">
                        {user.img_url && (
                          <Avatar size="sm" src={user.img_url} mr={2} />
                        )}
                        {user.username}
                      </Flex>
                    </Td>
                    <Td>{user.is_admin ? 'Admin' : 'User'}</Td>
                    <Td isNumeric>${(user.balance || 0).toFixed(2)}</Td>
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="green"
                        mr={2}
                        onClick={() => openBalanceModal(user)}
                      >
                        Add Funds
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onUserCreated={handleUserCreated}
      />

      {/* Add Balance Modal */}
      <Modal isOpen={isBalanceOpen} onClose={onBalanceClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Balance</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedUser && (
              <>
                <Flex alignItems="center" mb={4}>
                  {selectedUser.img_url && (
                    <Avatar size="md" src={selectedUser.img_url} mr={3} />
                  )}
                  <Text>
                    Adding funds to <strong>{selectedUser.username}</strong>'s account
                  </Text>
                </Flex>
                <Text mb={4}>
                  Current balance: <strong>${(selectedUser.balance || 0).toFixed(2)}</strong>
                </Text>
                
                <FormControl mb={4}>
                  <FormLabel>Amount to Add</FormLabel>
                  <InputGroup>
                    <InputRightElement pointerEvents="none">
                      $
                    </InputRightElement>
                    <NumberInput 
                      min={1} 
                      precision={2} 
                      step={1} 
                      value={balance} 
                      onChange={(value) => setBalance(parseFloat(value) || 0)}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </InputGroup>
                </FormControl>
                
                <HStack spacing={2} mb={2}>
                  <Text>Quick Add:</Text>
                  {quickBalanceOptions.map(amount => (
                    <Button 
                      key={amount} 
                      size="sm" 
                      onClick={() => setBalance(amount)}
                    >
                      ${amount}
                    </Button>
                  ))}
                </HStack>
              </>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBalanceClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleAddBalance}
            >
              Add Balance
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default UserManagement;