import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useDisclosure,
  Container,
  Heading,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { isOpen, onToggle } = useDisclosure();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Navbar */}
      <Box>
        <Flex
          bg={useColorModeValue('white', 'gray.800')}
          color={useColorModeValue('gray.600', 'white')}
          minH={'60px'}
          py={{ base: 2 }}
          px={{ base: 4 }}
          borderBottom={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.900')}
          align={'center'}
          boxShadow="sm"
        >
          <Flex
            flex={{ base: 1, md: 'auto' }}
            ml={{ base: -2 }}
            display={{ base: 'flex', md: 'none' }}
          >
            <IconButton
              onClick={onToggle}
              icon={
                isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
              }
              variant={'ghost'}
              aria-label={'Toggle Navigation'}
            />
          </Flex>
          <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
            <Link to="/">
              <Heading
                as="h1"
                size="md"
                textAlign={{ base: 'center', md: 'left' }}
                color={useColorModeValue('blue.600', 'blue.300')}
              >
                Gaming Cafe
              </Heading>
            </Link>

            <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
              <DesktopNav isAdmin={isAdmin()} currentPath={location.pathname} />
            </Flex>
          </Flex>

          {isAuthenticated() ? (
            <Stack
              flex={{ base: 1, md: 0 }}
              justify={'flex-end'}
              direction={'row'}
              spacing={6}
              align="center"
            >
              {user && (
                <Text display={{ base: 'none', md: 'inline-flex' }} mr={2}>
                  Balance: <Badge colorScheme="green" ml={1}>${user.balance?.toFixed(2) || '0.00'}</Badge>
                </Text>
              )}
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  <Avatar
                    size={'sm'}
                    name={user?.username}
                    src={user?.img_url}
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem isDisabled>
                    <Text fontWeight="bold">@{user?.username}</Text>
                  </MenuItem>
                  <MenuItem isDisabled>
                    <Text fontSize="sm" color="gray.500">
                      {user?.is_admin ? 'Administrator' : 'User'}
                    </Text>
                  </MenuItem>
                  <MenuItem isDisabled>
                    <Text fontSize="sm">
                      Balance: <strong>${user?.balance?.toFixed(2) || '0.00'}</strong>
                    </Text>
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={() => navigate('/profile')}>My Profile</MenuItem>
                  <MenuItem onClick={logout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </Stack>
          ) : (
            <Stack
              flex={{ base: 1, md: 0 }}
              justify={'flex-end'}
              direction={'row'}
              spacing={6}
            >
              <Button
                as={Link}
                fontSize={'sm'}
                fontWeight={400}
                variant={'link'}
                to={'/login'}
              >
                Sign In
              </Button>
              <Button
                as={Link}
                display={{ base: 'none', md: 'inline-flex' }}
                fontSize={'sm'}
                fontWeight={600}
                color={'white'}
                bg={'blue.500'}
                to={'/signup'}
                _hover={{
                  bg: 'blue.400',
                }}
              >
                Sign Up
              </Button>
            </Stack>
          )}
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <MobileNav isAdmin={isAdmin()} currentPath={location.pathname} onClose={() => onToggle()} />
        </Collapse>
      </Box>

      {/* Main content */}
      <Box py={4}>
        {children}
      </Box>
    </Box>
  );
};

const DesktopNav = ({ isAdmin, currentPath }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const activeLinkColor = useColorModeValue('blue.600', 'blue.300');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  const NAV_ITEMS = getNavItems(isAdmin);

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link to={navItem.href ?? '#'}>
                <Box
                  p={2}
                  fontSize={'sm'}
                  fontWeight={500}
                  color={currentPath === navItem.href ? activeLinkColor : linkColor}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}
                >
                  {navItem.label}
                </Box>
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}>
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} isActive={currentPath === child.href} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel, isActive }) => {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const activeLinkColor = useColorModeValue('blue.600', 'blue.300');
  
  return (
    <Link to={href}>
      <Box
        role={'group'}
        display={'block'}
        p={2}
        rounded={'md'}
        _hover={{ bg: useColorModeValue('blue.50', 'gray.900') }}
      >
        <Stack direction={'row'} align={'center'}>
          <Box>
            <Text
              transition={'all .3s ease'}
              color={isActive ? activeLinkColor : linkColor}
              fontWeight={500}
            >
              {label}
            </Text>
            <Text fontSize={'sm'}>{subLabel}</Text>
          </Box>
          <Flex
            transition={'all .3s ease'}
            transform={'translateX(-10px)'}
            opacity={0}
            _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
            justify={'flex-end'}
            align={'center'}
            flex={1}
          >
            <Icon color={'blue.400'} w={5} h={5} as={ChevronRightIcon} />
          </Flex>
        </Stack>
      </Box>
    </Link>
  );
};

const MobileNav = ({ isAdmin, currentPath, onClose }) => {
  const NAV_ITEMS = getNavItems(isAdmin);
  
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}
    >
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem 
          key={navItem.label} 
          {...navItem} 
          isActive={currentPath === navItem.href}
          onClick={onClose}
        />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href, isActive, onClick }) => {
  const { isOpen, onToggle } = useDisclosure();
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const activeLinkColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Link to={href ?? '#'} onClick={onClick}>
        <Flex
          py={2}
          justify={'space-between'}
          align={'center'}
          _hover={{
            textDecoration: 'none',
          }}
        >
          <Text
            fontWeight={600}
            color={isActive ? activeLinkColor : linkColor}
          >
            {label}
          </Text>
          {children && (
            <Icon
              as={ChevronDownIcon}
              transition={'all .25s ease-in-out'}
              transform={isOpen ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          )}
        </Flex>
      </Link>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}
        >
          {children &&
            children.map((child) => (
              <Link key={child.label} py={2} to={child.href} onClick={onClick}>
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

// Helper function to get navigation items based on user role
const getNavItems = (isAdmin) => {
  // Base navigation items for all authenticated users
  const baseNavItems = [
    {
      label: 'Dashboard',
      href: '/',
    },
    {
      label: 'My Profile',
      href: '/profile',
    }
  ];
  
  // Admin-only navigation items
  const adminNavItems = [
    {
      label: 'User Management',
      href: '/users',
    },
    {
      label: 'Machine Management',
      href: '/machines',
    },
    {
      label: 'Session Management',
      href: '/sessions',
    }
  ];
  
  return isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;
};

export default Layout;