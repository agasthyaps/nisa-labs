import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

// Function to extract name from email
const getNameFromEmail = (email: string | null | undefined): string => {
  if (!email) return 'Coach';

  // Get the part before @
  const beforeAt = email.split('@')[0];
  if (!beforeAt) return 'Coach';

  // Split on '.' and take the first part
  const firstPart = beforeAt.split('.')[0];
  if (!firstPart) return 'Coach';

  // Remove any trailing non-letter characters
  const cleanName = firstPart.replace(/[^a-zA-Z]+$/, '');
  if (!cleanName) return 'Coach';

  // Capitalize first letter
  return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
};

export const Greeting = () => {
  const { data: session } = useSession();

  // Get personalized name from email
  const userName = getNameFromEmail(session?.user?.email);

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Hey, {userName}!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        How can nisa help you today?
      </motion.div>
    </div>
  );
};
