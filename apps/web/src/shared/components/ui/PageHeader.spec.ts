import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PageHeader from '@/shared/components/ui/PageHeader.vue';

describe('PageHeader', () => {
  it('renders title and blurb', () => {
    const wrapper = mount(PageHeader, {
      props: {
        title: 'Orders',
        blurb: 'Track your café orders',
      },
    });
    expect(wrapper.text()).toContain('Orders');
    expect(wrapper.text()).toContain('Track your café orders');
  });

  it('renders actions slot', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Stock' },
      slots: {
        actions: '<button>Add</button>',
      },
    });
    expect(wrapper.find('button').text()).toBe('Add');
  });
});
