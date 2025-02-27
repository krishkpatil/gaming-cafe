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
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, SettingsIcon } from '@chakra-ui/icons';
import { getAllMachines, updateMachineStatus, deleteMachine } from '../services/machineService';
import CreateMachineModal from './CreateMachineModal';
import EditMachineModal from './EditMachineModal';
import { useAuth } from '../contexts/AuthContext';

const MachineManagement = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();

  // Fetch machines on component mount
  useEffect(() => {
    fetchMachines();
  }, []);

  // Fetch machines from API
  const fetchMachines = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllMachines();
      setMachines(response.machines || []);
    } catch (err) {
      console.error('Error fetching machines:', err);
      setError('Failed to load machines. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle machine creation
  const handleMachineCreated = (newMachine) => {
    setMachines([...machines, newMachine]);
  };

  // Handle machine update
  const handleMachineUpdated = (updatedMachine) => {
    setMachines(machines.map(machine => 
      machine.id === updatedMachine.id ? updatedMachine : machine
    ));
  };

  // Open edit modal for a machine
  const openEditModal = (machine) => {
    setSelectedMachine(machine);
    onEditOpen();
  };

  // Handle status change
  const handleStatusChange = async (machineId, newStatus) => {
    try {
      const response = await updateMachineStatus(machineId, { status: newStatus });
      
      // Update machine in the list
      setMachines(machines.map(machine => 
        machine.id === response.machine.id ? response.machine : machine
      ));

      toast({
        title: 'Status updated',
        description: `Machine status changed to ${newStatus}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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

  // Handle machine deletion
  const handleDeleteMachine = async (machineId) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await deleteMachine(machineId);
        
        // Remove machine from the list
        setMachines(machines.filter(machine => machine.id !== machineId));

        toast({
          title: 'Machine deleted',
          description: 'Machine has been deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'green';
      case 'In Use':
        return 'blue';
      case 'Maintenance':
        return 'orange';
      default:
        return 'gray';
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header section */}
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">Machine Management</Heading>
        
        <Button 
          colorScheme="blue" 
          leftIcon={<AddIcon />} 
          onClick={onCreateOpen}
        >
          Add Machine
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
        // Machines table
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th isNumeric>Hourly Rate</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {machines.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center">No machines found</Td>
                </Tr>
              ) : (
                machines.map(machine => (
                  <Tr key={machine.id}>
                    <Td>{machine.id}</Td>
                    <Td>{machine.name}</Td>
                    <Td>{machine.machine_type}</Td>
                    <Td isNumeric>${machine.hourly_rate.toFixed(2)}/hr</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(machine.status)}>
                        {machine.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex>
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="blue"
                          mr={2}
                          aria-label="Edit machine"
                          onClick={() => openEditModal(machine)}
                        />
                        
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<SettingsIcon />}
                            size="sm"
                            variant="outline"
                            mr={2}
                            aria-label="Change status"
                          />
                          <MenuList>
                            <MenuItem 
                              onClick={() => handleStatusChange(machine.id, 'Available')}
                              isDisabled={machine.status === 'In Use'}
                            >
                              Set Available
                            </MenuItem>
                            <MenuItem 
                              onClick={() => handleStatusChange(machine.id, 'Maintenance')}
                              isDisabled={machine.status === 'In Use'}
                            >
                              Set Maintenance
                            </MenuItem>
                          </MenuList>
                        </Menu>
                        
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          aria-label="Delete machine"
                          onClick={() => handleDeleteMachine(machine.id)}
                          isDisabled={machine.status === 'In Use'}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Create Machine Modal */}
      <CreateMachineModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onMachineCreated={handleMachineCreated}
      />

      {/* Edit Machine Modal */}
      {selectedMachine && (
        <EditMachineModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          machine={selectedMachine}
          onMachineUpdated={handleMachineUpdated}
        />
      )}
    </Container>
  );
};

export default MachineManagement;