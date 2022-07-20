#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MainQueueAndDLQStack } from '../lib/main_queue_and_dlq_stack';

const app = new cdk.App();
new MainQueueAndDLQStack(app, 'MainQueueAndDLQStack');