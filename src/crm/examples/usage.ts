/**
 * LinkedIn Lead CRM - Usage Examples
 *
 * This file demonstrates how to use the CRM API.
 */

import * as CRM from '../index';

/**
 * Example 1: Basic Lead Creation and Event Flow
 */
export async function example1_BasicFlow() {
  console.log('=== Example 1: Basic Lead Creation and Event Flow ===\n');

  // Create a new lead
  const lead = await CRM.createLead(
    'John Doe',
    'https://linkedin.com/in/johndoe',
    {
      company: 'Acme Corp',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
    }
  );
  console.log('Created lead:', lead.name, '- Stage:', lead.stage);

  // Send connection request
  const updated1 = await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
  console.log('After sending request - Stage:', updated1.stage);

  // Connection accepted
  const updated2 = await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
  console.log('After connection accepted - Stage:', updated2.stage);

  // Send DM (moves to ACTIVE_CONVO)
  const updated3 = await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);
  console.log('After sending DM - Stage:', updated3.stage);

  // Schedule meeting
  const updated4 = await CRM.applyEvent(lead.id, CRM.Event.MEETING_SCHEDULED);
  console.log('After scheduling meeting - Stage:', updated4.stage);

  console.log('\n✓ Example 1 completed successfully\n');
  return lead;
}

/**
 * Example 2: Invalid Transition (Error Handling)
 */
export async function example2_InvalidTransition() {
  console.log('=== Example 2: Invalid Transition (Error Handling) ===\n');

  // Create a new lead
  const lead = await CRM.createLead(
    'Jane Smith',
    'https://linkedin.com/in/janesmith'
  );
  console.log('Created lead:', lead.name, '- Stage:', lead.stage);

  try {
    // Try to send DM without being connected (illegal transition)
    await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);
    console.log('❌ This should not happen - invalid transition was allowed!');
  } catch (error) {
    if (error instanceof CRM.InvalidTransitionError) {
      console.log('✓ Correctly rejected invalid transition:');
      console.log('  Error:', error.message);
      console.log('  Current stage:', error.currentStage);
      console.log('  Attempted event:', error.event);
    } else {
      throw error;
    }
  }

  console.log('\n✓ Example 2 completed successfully\n');
  return lead;
}

/**
 * Example 3: Next Actions and Notes
 */
export async function example3_ActionsAndNotes() {
  console.log('=== Example 3: Next Actions and Notes ===\n');

  const lead = await CRM.createLead(
    'Bob Johnson',
    'https://linkedin.com/in/bobjohnson'
  );
  console.log('Created lead:', lead.name);

  // Add notes
  await CRM.addNote(lead.id, 'Met at tech conference in Austin');
  await CRM.addNote(lead.id, 'Interested in our product demo');
  const withNotes = await CRM.getLeadById(lead.id);
  console.log('Added notes:', withNotes!.notes.length, 'total notes');

  // Set next action
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // 7 days from now
  await CRM.setNextAction(
    lead.id,
    'Follow up about product demo',
    dueDate.toISOString()
  );
  const withAction = await CRM.getLeadById(lead.id);
  console.log('Set next action:', withAction!.nextAction?.action);
  console.log('Due at:', new Date(withAction!.nextAction!.dueAt).toLocaleDateString());

  // Add tags
  await CRM.addTags(lead.id, ['hot-lead', 'product-demo', 'austin-conference']);
  const withTags = await CRM.getLeadById(lead.id);
  console.log('Tags:', withTags!.tags.join(', '));

  console.log('\n✓ Example 3 completed successfully\n');
  return lead;
}

/**
 * Example 4: Querying and Filtering
 */
export async function example4_QueryingAndFiltering() {
  console.log('=== Example 4: Querying and Filtering ===\n');

  // Create some sample leads in different stages
  const leads = await Promise.all([
    CRM.createLead('Alice Cooper', 'https://linkedin.com/in/alicecooper'),
    CRM.createLead('Charlie Brown', 'https://linkedin.com/in/charliebrown'),
    CRM.createLead('Diana Prince', 'https://linkedin.com/in/dianaprince'),
  ]);

  // Move them to different stages
  await CRM.applyEvent(leads[0].id, CRM.Event.CONNECTION_REQUEST_SENT);
  await CRM.applyEvent(leads[1].id, CRM.Event.CONNECTION_REQUEST_SENT);
  await CRM.applyEvent(leads[1].id, CRM.Event.CONNECTION_ACCEPTED);

  // Add tags to some
  await CRM.addTags(leads[0].id, ['enterprise']);
  await CRM.addTags(leads[1].id, ['enterprise', 'urgent']);

  // Set next action for one
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await CRM.setNextAction(leads[1].id, 'Send proposal', tomorrow.toISOString());

  // Query all leads
  const allLeads = await CRM.listLeads();
  console.log('Total leads:', allLeads.length);

  // Query by stage
  const requestSent = await CRM.listLeads({ stage: CRM.Stage.REQUEST_SENT });
  console.log('Leads in REQUEST_SENT stage:', requestSent.length);

  // Query by tags
  const enterpriseLeads = await CRM.listLeads({ tags: ['enterprise'] });
  console.log('Leads tagged "enterprise":', enterpriseLeads.length);

  // Query with next action
  const withActions = await CRM.listLeads({ hasNextAction: true });
  console.log('Leads with next actions:', withActions.length);

  // Get stats
  const stats = await CRM.getStats();
  console.log('\nPipeline stats:');
  Object.entries(stats).forEach(([stage, count]) => {
    if (count > 0) {
      console.log(`  ${stage}: ${count}`);
    }
  });

  console.log('\n✓ Example 4 completed successfully\n');
}

/**
 * Example 5: Merge by Profile URL (Deduplication)
 */
export async function example5_MergeByProfileUrl() {
  console.log('=== Example 5: Merge by Profile URL (Deduplication) ===\n');

  const profileUrl = 'https://linkedin.com/in/evanwilliams';

  // First creation
  const lead1 = await CRM.mergeByProfileUrl(profileUrl, {
    name: 'Evan Williams',
    tags: ['startup'],
  });
  console.log('First creation - ID:', lead1.id, 'Tags:', lead1.tags);

  // Second "creation" with same URL - should merge
  const lead2 = await CRM.mergeByProfileUrl(profileUrl, {
    name: 'Evan Williams', // Same name
    tags: ['founder'], // New tag
    meta: { company: 'Twitter' }, // New metadata
  });
  console.log('Second merge - ID:', lead2.id, 'Tags:', lead2.tags);

  // Verify they have the same ID (deduplicated)
  console.log('Same lead?', lead1.id === lead2.id ? '✓ Yes' : '❌ No');
  console.log('Tags combined?', lead2.tags.includes('startup') && lead2.tags.includes('founder') ? '✓ Yes' : '❌ No');

  console.log('\n✓ Example 5 completed successfully\n');
  return lead2;
}

/**
 * Example 6: Nurture and Lost Flows
 */
export async function example6_NurtureAndLost() {
  console.log('=== Example 6: Nurture and Lost Flows ===\n');

  // Create lead and connect
  const lead1 = await CRM.createLead('Frank Miller', 'https://linkedin.com/in/frankmiller');
  await CRM.applyEvent(lead1.id, CRM.Event.CONNECTION_REQUEST_SENT);
  await CRM.applyEvent(lead1.id, CRM.Event.CONNECTION_ACCEPTED);
  console.log('Created and connected with:', lead1.name);

  // Move to nurture (not ready to engage)
  const nurtured = await CRM.applyEvent(lead1.id, CRM.Event.SET_NURTURE);
  console.log('Moved to nurture - Stage:', nurtured.stage);

  // Can revive from nurture by sending DM
  const revived = await CRM.applyEvent(lead1.id, CRM.Event.DM_SENT);
  console.log('Revived from nurture - Stage:', revived.stage);

  // Create another lead and mark as lost
  const lead2 = await CRM.createLead('Grace Hopper', 'https://linkedin.com/in/gracehopper');
  const lost = await CRM.applyEvent(lead2.id, CRM.Event.MARK_LOST);
  console.log('Marked as lost - Stage:', lost.stage);

  // Try to revive from lost (should fail - terminal state)
  try {
    await CRM.applyEvent(lead2.id, CRM.Event.DM_SENT);
    console.log('❌ Should not be able to revive from LOST');
  } catch (error) {
    if (error instanceof CRM.InvalidTransitionError) {
      console.log('✓ Correctly prevented transition from LOST state');
    }
  }

  console.log('\n✓ Example 6 completed successfully\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  LinkedIn Lead CRM - Usage Examples   ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await example1_BasicFlow();
    await example2_InvalidTransition();
    await example3_ActionsAndNotes();
    await example4_QueryingAndFiltering();
    await example5_MergeByProfileUrl();
    await example6_NurtureAndLost();

    console.log('╔════════════════════════════════════════╗');
    console.log('║  ✓ All examples completed successfully ║');
    console.log('╚════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

// For testing in browser console:
// import { runAllExamples } from './crm/examples/usage';
// runAllExamples();
