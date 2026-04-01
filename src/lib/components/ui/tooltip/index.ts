import Root from './tooltip.svelte';
import Trigger from './tooltip-trigger.svelte';
import Content from './tooltip-content.svelte';
import Provider from './tooltip-provider.svelte';
import Portal from './tooltip-portal.svelte';
import HelpTooltip from './help-tooltip.svelte';

export {
	Root,
	Trigger,
	Content,
	Provider,
	Portal,
	HelpTooltip,
	//
	Root as Tooltip,
	Content as TooltipContent,
	Trigger as TooltipTrigger,
	Provider as TooltipProvider,
	Portal as TooltipPortal,
	HelpTooltip as TooltipHelp
};
