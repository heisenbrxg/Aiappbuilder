import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json, useLoaderData, useLocation } from '@remix-run/react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '~/components/auth/AuthProvider';
import { Footer } from '~/components/footer/Footer';
import { ServerBillingService } from '~/lib/billing/billingService.server';
import { billingService } from '~/lib/billing/billingService';
import type { SubscriptionPlan } from '~/lib/billing/billingService';
// ... existing code ...