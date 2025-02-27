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
  Avatar,
  IconButton,
  useColorModeValue
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { getAllUsers, addUserBalance, deleteUser } from '../services/userService';
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
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();
  const highlightColor = useColorModeValue('red.50', 'red.900');

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

  // Open delete confirmation modal for a user
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    onDeleteOpen();
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

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      // Don't allow deleting yourself
      if (selectedUser.id === user.id) {
        toast({
          title: 'Cannot delete own account',
          description: 'You cannot delete your own account',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        onDeleteClose();
        return;
      }

      await deleteUser(selectedUser.id);
      
      // Remove user from list
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      toast({
        title: 'User deleted',
        description: `${selectedUser.username} has been deleted successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDeleteClose();
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
                users.map(userItem => (
                  <Tr 
                    key={userItem.id}
                    bg={userItem.id === user.id ? highlightColor : ""}
                  >
                    <Td>{userItem.id}</Td>
                    <Td>
                      <Flex alignItems="center">
                        {userItem.img_url && (
                          <Avatar size="sm" src={userItem.img_url} mr={2} />
                        )}
                        {userItem.username}
                      </Flex>
                    </Td>
                    <Td>{userItem.is_admin ? 'Admin' : 'User'}</Td>
                    <Td isNumeric>${(userItem.balance || 0).toFixed(2)}</Td>
                    <Td>
                      <HStack>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => openBalanceModal(userItem)}
                        >
                          Add Funds
                        </Button>
                        <IconButton
                          size="sm"
                          colorScheme="red"
                          icon={<DeleteIcon />}
                          onClick={() => openDeleteModal(userItem)}
                          aria-label="Delete user"
                          isDisabled={userItem.id === user.id} // Can't delete yourself
                        />
                      </HStack>
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

      {/* Delete User Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete User</ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedUser && (
              <>
                <Text mb={4}>
                  Are you sure you want to delete <strong>{selectedUser.username}</strong>?
                </Text>
                <Text fontWeight="bold" color="red.500">
                  This action cannot be undone.
                </Text>
                <Text mt={2}>
                  All of this user's data, including session history, will be permanently removed.
                </Text>
              </>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteUser}
            >
              Delete User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default UserManagement;